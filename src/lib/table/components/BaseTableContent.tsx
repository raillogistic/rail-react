import React from "react";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/auth/context";
import { useMetadata } from "../context/MetadataContext";
import { useTable } from "../context/TableContext";
import {
  useTablePersistence,
  loadPersistedTableState,
  decodeTableConfigs,
} from "../hooks/useTablePersistence";
import { useTableData } from "../hooks/useTableData";
import { TableHeader } from "./TableHeader";
import { TableRows } from "./TableRow";
import { TablePagination } from "./TablePagination";
import { TableFrame, TableBody } from "./TableFrame";
import type {
  BaseModelTableColumnActionsInput,
  BaseModelTableColumnDef,
  BaseModelTableField,
  BaseModelTableFieldsInput,
  BaseModelTableColumnOrderingConfig,
  BaseModelTableRelationConfig,
  BaseModelTableRelationStatsConfig,
  FieldSchema,
  RelationshipSchema,
} from "../types";
import {
  getDefaultHiddenColumnIds,
  getSyntheticRelationCountSource,
  isAccessorExcluded,
  mergeBaseModelTableFields,
  normalizeBaseModelTableFieldsInput,
  toCamelCase,
  toGraphqlFieldName,
  toSnakeCase,
} from "../utils";
import type {
  ModelTableV2PerformanceOptions,
  ModelTableV2TableConfig,
  ModelTableV2ViewOptions,
} from "../config/types";

type BaseTableContentProps = {
  persistenceKey?: string;
  children?: React.ReactNode;
  tableConfig?: ModelTableV2TableConfig;
  view?: ModelTableV2ViewOptions;
  performance?: ModelTableV2PerformanceOptions;
  hideTableOnMobile?: boolean;
  fields?: BaseModelTableFieldsInput;
  relations?: Record<string, BaseModelTableRelationConfig>;
  relationStats?: BaseModelTableRelationStatsConfig;
  queryManager?: string;
  columnOrdering?: BaseModelTableColumnOrderingConfig;
  skipCount?: boolean;
  disableSorting?: boolean;
  enableSelection?: boolean;
  columnActions?: BaseModelTableColumnActionsInput;
};

export function BaseTableContent({
  persistenceKey,
  children,
  tableConfig,
  performance,
  hideTableOnMobile,
  fields,
  relations,
  relationStats,
  queryManager,
  columnOrdering,
  skipCount,
  disableSorting,
  enableSelection,
  columnActions,
}: BaseTableContentProps) {
  const { user } = useAuthContext();
  const {
    metadata,
    loading: metadataLoading,
    error: metadataError,
    app,
    model,
  } = useMetadata();
  const {
    columnOrder,
    setColumnOrder,
    setColumnVisibility,
    columnVisibility,
    groupingField,
    pagination,
    loading: tableLoading,
    data,
    setPage,
    error: dataError,
  } = useTable();
  const tableScrollRef = React.useRef<HTMLDivElement>(null);
  const isInfiniteMode = performance?.dataMode === "infinite";

  const locationPath =
    typeof window !== "undefined" ? window.location.pathname : "";
  const effectiveKey = persistenceKey || `${app}-${model}-${locationPath}`;
  useTablePersistence(effectiveKey);

  // Get user table configs from auth context
  const userTableConfigs = React.useMemo(() => {
    const settings = user?.settings as
      | { table_configs?: unknown; tableConfigs?: unknown }
      | undefined;
    return decodeTableConfigs(
      settings?.table_configs ?? settings?.tableConfigs ?? null,
    );
  }, [user?.settings]);

  // Check if we have persisted state for this table (loaded synchronously)
  const persistedStateRef = React.useRef<
    ReturnType<typeof loadPersistedTableState> | null | undefined
  >(undefined);
  const hasConsumedPersistedOrderRef = React.useRef(false);
  const persistedSeedRef = React.useRef<{
    key: string;
    userId: string | null;
    settingsRef: unknown;
  } | null>(null);
  const currentUserId = user?.id ? String(user.id) : null;
  const shouldRefreshPersistedSeed =
    !persistedSeedRef.current ||
    persistedSeedRef.current.key !== effectiveKey ||
    persistedSeedRef.current.userId !== currentUserId ||
    persistedSeedRef.current.settingsRef !== userTableConfigs;
  if (shouldRefreshPersistedSeed) {
    hasConsumedPersistedOrderRef.current = false;
    persistedSeedRef.current = {
      key: effectiveKey,
      userId: currentUserId,
      settingsRef: userTableConfigs,
    };
    persistedStateRef.current = loadPersistedTableState(
      effectiveKey,
      userTableConfigs,
      { allowLocalFallback: true },
    );
  }

  const normalizedFieldsConfig = React.useMemo(
    () => normalizeBaseModelTableFieldsInput(fields),
    [fields],
  );
  const excludedAccessors = React.useMemo(
    () => new Set(normalizedFieldsConfig.exclude),
    [normalizedFieldsConfig.exclude],
  );
  const hasConfiguredInclude = normalizedFieldsConfig.include !== undefined;
  const explicitlyAddedAccessors = React.useMemo(() => {
    const accessors = new Set<string>();
    const toCamelCase = (value: string) =>
      value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
    const toSnakeCase = (value: string) =>
      value
        .replace(/([A-Z])/g, "_$1")
        .toLowerCase()
        .replace(/^_/, "");
    const addAccessorVariants = (value: string) => {
      if (!value) return;
      const roots = [value, value.split(".")[0], value.split("__")[0]];
      roots.forEach((root) => {
        if (!root) return;
        accessors.add(root);
        accessors.add(toCamelCase(root));
        accessors.add(toSnakeCase(root));
      });
    };
    normalizedFieldsConfig.add.forEach((entry) => {
      addAccessorVariants(entry.accessor);
    });
    return accessors;
  }, [normalizedFieldsConfig.add]);

  const defaultHiddenColumnIds = React.useMemo(() => {
    if (hasConfiguredInclude) return new Set<string>();
    const hidden = getDefaultHiddenColumnIds(metadata);
    explicitlyAddedAccessors.forEach((accessor) => {
      hidden.delete(accessor);
    });
    return hidden;
  }, [explicitlyAddedAccessors, hasConfiguredInclude, metadata]);

  const queryVisibleAccessors = React.useMemo(() => {
    if (!metadata) return undefined;

    const persistedVisibility =
      persistedStateRef.current?.columnVisibility ?? {};
    const visibilitySource =
      Object.keys(columnVisibility).length > 0
        ? columnVisibility
        : persistedVisibility;
    const hasVisibilityOverrides = Object.keys(visibilitySource).length > 0;

    const fieldCanonicalByKey = new Map<string, string>();
    metadata.fields.forEach((field) => {
      const canonicalName = toGraphqlFieldName(field.name || field.fieldName);
      if (!canonicalName) return;
      [
        field.name,
        field.fieldName,
        canonicalName,
        toSnakeCase(canonicalName),
        toCamelCase(canonicalName),
      ]
        .filter((entry): entry is string => !!entry)
        .forEach((entry) => fieldCanonicalByKey.set(entry, canonicalName));
    });

    const relationCanonicalByKey = new Map<string, string>();
    metadata.relationships.forEach((relation) => {
      const canonicalName = toGraphqlFieldName(
        relation.name || relation.fieldName,
      );
      if (!canonicalName) return;
      [
        relation.name,
        relation.fieldName,
        canonicalName,
        toSnakeCase(canonicalName),
        toCamelCase(canonicalName),
      ]
        .filter((entry): entry is string => !!entry)
        .forEach((entry) => relationCanonicalByKey.set(entry, canonicalName));
    });

    const canonicalizeRoot = (root: string) =>
      relationCanonicalByKey.get(root) ??
      fieldCanonicalByKey.get(root) ??
      toGraphqlFieldName(root);

    const canonicalizeAccessor = (accessor: string) => {
      const parts = accessor.replace(/__/g, ".").split(".").filter(Boolean);
      if (parts.length === 0) return "";
      const [root, ...rest] = parts;
      const normalizedRoot = canonicalizeRoot(root);
      if (!normalizedRoot) return "";
      const normalizedRest = rest.map((segment) => toGraphqlFieldName(segment));
      return [normalizedRoot, ...normalizedRest.filter(Boolean)].join(".");
    };

    const defaultDisplay = metadata.fields
      .filter((field) => field.visibility !== "hidden")
      .map((field) => toGraphqlFieldName(field.name || field.fieldName))
      .filter(Boolean)
      .filter((accessor) => !isAccessorExcluded(accessor, excludedAccessors));

    const includeEntries = mergeBaseModelTableFields({
      include: normalizedFieldsConfig.include,
      defaults: defaultDisplay,
      add: normalizedFieldsConfig.add,
      excludedAccessors,
    })
      .map((entry) =>
        canonicalizeAccessor(
          typeof entry === "string" ? entry : entry.accessor,
        ),
      )
      .filter(Boolean);

    const uniqueAccessors = Array.from(new Set(includeEntries));

    const resolveVisibility = (accessor: string): boolean | undefined => {
      const candidates = [
        accessor,
        toSnakeCase(accessor),
        toCamelCase(accessor),
        accessor.split(".")[0],
        toSnakeCase(accessor.split(".")[0]),
        toCamelCase(accessor.split(".")[0]),
      ];
      for (const candidate of candidates) {
        const value = visibilitySource[candidate];
        if (typeof value === "boolean") return value;
      }
      return undefined;
    };

    return uniqueAccessors.filter((accessor) => {
      const explicitVisibility = resolveVisibility(accessor);
      if (explicitVisibility === false) return false;
      if (explicitVisibility === true) return true;
      if (hasVisibilityOverrides) return true;
      if (hasConfiguredInclude) return true;
      return !defaultHiddenColumnIds.has(accessor);
    });
  }, [
    columnVisibility,
    defaultHiddenColumnIds,
    excludedAccessors,
    hasConfiguredInclude,
    metadata,
    normalizedFieldsConfig.add,
    normalizedFieldsConfig.include,
  ]);

  const requiredDataAccessors = React.useMemo(() => {
    if (!groupingField) return [];
    return [groupingField];
  }, [groupingField]);

  const queryConfig = React.useMemo(
    () => ({
      fields,
      relations,
      queryManager,
      skipCount: skipCount ?? true,
      dataMode: performance?.dataMode ?? "pagination",
      visibleAccessors: queryVisibleAccessors,
      requiredAccessors: requiredDataAccessors,
    }),
    [
      fields,
      performance?.dataMode,
      queryVisibleAccessors,
      relations,
      queryManager,
      requiredDataAccessors,
      skipCount,
    ],
  );
  const { refetch } = useTableData(queryConfig);
  const resolvedEnableSelection = React.useMemo(() => {
    if (enableSelection) return true;
    const templates = metadata?.templates ?? [];
    return templates.length > 0;
  }, [enableSelection, metadata?.templates]);

  const columnDefs = React.useMemo(() => {
    if (!metadata) return null;

    const fieldLookup = new Map<string, FieldSchema>();
    const fieldCanonicalByKey = new Map<string, string>();
    metadata.fields.forEach((field) => {
      const canonical = toGraphqlFieldName(field.name || field.fieldName);
      [
        field.name,
        field.fieldName,
        canonical,
        toSnakeCase(canonical),
        toCamelCase(canonical),
      ]
        .filter((entry): entry is string => !!entry)
        .forEach((entry) => {
          fieldLookup.set(entry, field);
          fieldCanonicalByKey.set(entry, canonical);
        });
    });
    const relationLookup = new Map<string, RelationshipSchema>();
    const relationCanonicalByKey = new Map<string, string>();
    metadata.relationships.forEach((relation) => {
      const canonical = toGraphqlFieldName(relation.name || relation.fieldName);
      [
        relation.name,
        relation.fieldName,
        canonical,
        toSnakeCase(canonical),
        toCamelCase(canonical),
      ]
        .filter((entry): entry is string => !!entry)
        .forEach((entry) => {
          relationLookup.set(entry, relation);
          relationCanonicalByKey.set(entry, canonical);
        });
    });
    const canonicalizeRoot = (root: string) =>
      relationCanonicalByKey.get(root) ??
      fieldCanonicalByKey.get(root) ??
      toGraphqlFieldName(root);
    const canonicalizeAccessor = (accessor: string) => {
      const parts = accessor.replace(/__/g, ".").split(".").filter(Boolean);
      if (parts.length === 0) return "";
      const [root, ...rest] = parts;
      const normalizedRoot = canonicalizeRoot(root);
      if (!normalizedRoot) return "";
      const normalizedRest = rest.map((segment) => toGraphqlFieldName(segment));
      return [normalizedRoot, ...normalizedRest.filter(Boolean)].join(".");
    };
    const resolveRelationCountSource = (
      accessor: string,
      field?: FieldSchema,
    ) => {
      const syntheticSource = field
        ? getSyntheticRelationCountSource(field)
        : undefined;
      if (syntheticSource) {
        return (
          relationCanonicalByKey.get(syntheticSource) ??
          toGraphqlFieldName(syntheticSource)
        );
      }
      const stripped = accessor.replace(/count$/i, "");
      if (!stripped || stripped === accessor) return null;
      const candidates = new Set<string>([
        stripped,
        toCamelCase(stripped),
        toSnakeCase(stripped),
      ]);
      for (const candidate of candidates) {
        const canonical = relationCanonicalByKey.get(candidate);
        if (canonical) return canonical;
      }
      return null;
    };
    const resolveRootValue = (row: Record<string, unknown>, root: string) => {
      const candidates = [root, toCamelCase(root), toSnakeCase(root)];
      for (const key of candidates) {
        if (Object.prototype.hasOwnProperty.call(row, key)) {
          return row[key];
        }
      }
      return undefined;
    };

    const buildColumnDef = (
      accessor: string,
      titleOverride?: string,
      render?: BaseModelTableColumnDef["render"],
    ): BaseModelTableColumnDef => {
      const normalizedAccessor = canonicalizeAccessor(accessor);
      if (!normalizedAccessor) {
        return {
          id: accessor,
          accessor,
          title: titleOverride || accessor,
          render,
        };
      }
      const parts = normalizedAccessor.split(".");
      const root = parts[0];
      const fieldMeta = fieldLookup.get(root);
      const relationMeta = relationLookup.get(root);
      const isRelation = !!fieldMeta?.isRelation || !!relationMeta;
      const isToManyRelation = !!relationMeta?.isToMany;
      const relationCountSource = resolveRelationCountSource(
        normalizedAccessor,
        fieldMeta,
      );
      const relationConfig =
        relations?.[root] ??
        relations?.[toSnakeCase(root)] ??
        relations?.[toCamelCase(root)];
      const displayField = toGraphqlFieldName(
        relationConfig?.display ?? "desc",
      );
      const displayAccessor =
        parts.length === 1 && isRelation && !isToManyRelation
          ? `${normalizedAccessor}.${displayField}`
          : isToManyRelation && parts.length > 1
            ? root
            : normalizedAccessor;
      const relationCountRender: BaseModelTableColumnDef["render"] | undefined =
        relationCountSource
          ? (_value, row) => {
              const relationValue = resolveRootValue(row, relationCountSource);
              if (Array.isArray(relationValue)) return relationValue.length;
              return 0;
            }
          : undefined;
      const title =
        titleOverride ||
        fieldMeta?.verboseName ||
        relationMeta?.verboseName ||
        parts[parts.length - 1] ||
        normalizedAccessor;

      return {
        id: normalizedAccessor,
        accessor: displayAccessor,
        title,
        render: render ?? relationCountRender,
      };
    };

    const defaultDisplay = metadata.fields
      .filter((field) => field.visibility !== "hidden")
      .map((field) => toGraphqlFieldName(field.name || field.fieldName))
      .filter(Boolean)
      .filter((accessor) => !isAccessorExcluded(accessor, excludedAccessors));
    const includeEntriesRaw = mergeBaseModelTableFields({
      include: normalizedFieldsConfig.include,
      defaults: defaultDisplay,
      add: normalizedFieldsConfig.add,
      excludedAccessors,
    });
    const includeEntries = includeEntriesRaw.reduce<BaseModelTableField[]>(
      (acc, entry) => {
        if (typeof entry === "string") {
          const canonicalAccessor = canonicalizeAccessor(entry);
          if (!canonicalAccessor) return acc;
          if (
            acc.some(
              (item) =>
                (typeof item === "string" ? item : item.accessor) ===
                canonicalAccessor,
            )
          ) {
            return acc;
          }
          acc.push(canonicalAccessor);
          return acc;
        }
        const canonicalAccessor = canonicalizeAccessor(entry.accessor);
        if (!canonicalAccessor) return acc;
        if (
          acc.some(
            (item) =>
              (typeof item === "string" ? item : item.accessor) ===
              canonicalAccessor,
          )
        ) {
          return acc;
        }
        acc.push({
          ...entry,
          accessor: canonicalAccessor,
        });
        return acc;
      },
      [],
    );

    return includeEntries.map((entry) => {
      if (typeof entry === "string") {
        const renderOverride =
          normalizedFieldsConfig.render[entry] ??
          normalizedFieldsConfig.render[toSnakeCase(entry)] ??
          normalizedFieldsConfig.render[entry.split(".")[0]];
        return buildColumnDef(
          entry,
          undefined,
          renderOverride
            ? (value, row, context) =>
                renderOverride(value, row, context.data, context.refetch)
            : undefined,
        );
      }
      const renderOverride =
        normalizedFieldsConfig.render[entry.accessor] ??
        normalizedFieldsConfig.render[toSnakeCase(entry.accessor)] ??
        normalizedFieldsConfig.render[entry.accessor.split(".")[0]];
      return buildColumnDef(
        entry.accessor,
        entry.title,
        entry.render ??
          (renderOverride
            ? (value, row, context) =>
                renderOverride(value, row, context.data, context.refetch)
            : undefined),
      );
    });
  }, [excludedAccessors, metadata, normalizedFieldsConfig, relations]);

  const sortableColumnIds = React.useMemo(() => {
    if (!columnDefs || columnDefs.length === 0) return columnOrder;
    const ids = columnDefs.map((column) => column.id);
    if (columnOrder.length === 0) return ids;
    const ordered = columnOrder.filter((id) => ids.includes(id));
    const orderedSet = new Set(ordered);
    const missing = ids.filter((id) => !orderedSet.has(id));
    return [...ordered, ...missing];
  }, [columnDefs, columnOrder]);

  const allowColumnDrag = columnOrdering?.draggable !== false;
  const lockedColumns = React.useMemo(
    () => new Set(columnOrdering?.locked ?? []),
    [columnOrdering?.locked],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (!allowColumnDrag) return;
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (lockedColumns.has(activeId) || lockedColumns.has(overId)) return;
    if (activeId === overId) return;

    const orderSource =
      sortableColumnIds.length > 0 ? sortableColumnIds : columnOrder;
    if (orderSource.length === 0) return;

    const oldIndex = orderSource.indexOf(activeId);
    const newIndex = orderSource.indexOf(overId);
    if (oldIndex < 0 || newIndex < 0) return;

    setColumnOrder(arrayMove(orderSource, oldIndex, newIndex));
  };

  React.useEffect(() => {
    if (columnOrder.length > 0) {
      hasConsumedPersistedOrderRef.current = true;
    }
  }, [columnOrder]);

  const resolveColumnOrder = React.useCallback(
    (availableIds: string[]) => {
      const mode = columnOrdering?.mode ?? "persisted";
      const append = columnOrdering?.append ?? "end";
      const configOrder = columnOrdering?.order ?? [];

      const persistedOrder = persistedStateRef.current?.columnOrder;
      const canUsePersistedFallback =
        mode === "persisted" &&
        !hasConsumedPersistedOrderRef.current &&
        columnOrder.length === 0 &&
        !!persistedOrder &&
        persistedOrder.length > 0;
      const effectiveColumnOrder = canUsePersistedFallback
        ? persistedOrder
        : columnOrder;

      const baseOrder =
        mode === "persisted" && effectiveColumnOrder.length > 0
          ? effectiveColumnOrder
          : configOrder.length > 0
            ? configOrder
            : availableIds;
      const availableSet = new Set(availableIds);
      const normalize = (entries: string[], valid: Set<string>) => {
        const next: string[] = [];
        const seen = new Set<string>();
        entries.forEach((id) => {
          if (!valid.has(id) || seen.has(id)) return;
          next.push(id);
          seen.add(id);
        });
        return next;
      };
      const baseNormalized = normalize(baseOrder, availableSet);
      const baseSet = new Set(baseNormalized);
      const missing = availableIds.filter((id) => !baseSet.has(id));
      const missingSet = new Set(missing);
      const preferredMissing = normalize(configOrder, missingSet);
      const preferredSet = new Set(preferredMissing);
      const remainingMissing = missing.filter((id) => !preferredSet.has(id));
      const combined =
        append === "start"
          ? [...preferredMissing, ...remainingMissing, ...baseNormalized]
          : [...baseNormalized, ...preferredMissing, ...remainingMissing];

      const same =
        combined.length === columnOrder.length &&
        combined.every((id, index) => columnOrder[index] === id);
      if (!same) {
        setColumnOrder(combined);
      }
      if (canUsePersistedFallback) {
        hasConsumedPersistedOrderRef.current = true;
      }
    },
    [columnOrder, columnOrdering, setColumnOrder],
  );

  React.useEffect(() => {
    if (!metadata?.fields) return;

    // Use persisted visibility if available, otherwise use current context
    const persistedVisibility = persistedStateRef.current?.columnVisibility;
    const persistedVisibilityVersion =
      persistedStateRef.current?.visibilityVersion ?? 0;
    const shouldHydrateFromPersistedVisibility =
      !!persistedVisibility &&
      Object.keys(persistedVisibility).length > 0 &&
      Object.keys(columnVisibility).length === 0;
    const effectiveVisibility = shouldHydrateFromPersistedVisibility
      ? persistedVisibility
      : columnVisibility;
    const shouldForceLegacyHiddenDefaults =
      shouldHydrateFromPersistedVisibility && persistedVisibilityVersion < 3;

    const targetColumns = columnDefs;
    if (targetColumns && targetColumns.length > 0) {
      const columnIds = targetColumns.map((column) => column.id);
      resolveColumnOrder(columnIds);

      const nextVisibility: Record<string, boolean> = {
        ...effectiveVisibility,
      };
      let visibilityChanged = false;
      columnIds.forEach((id) => {
        if (nextVisibility[id] === undefined) {
          nextVisibility[id] = !defaultHiddenColumnIds.has(id);
          visibilityChanged = true;
          return;
        }
        if (
          shouldForceLegacyHiddenDefaults &&
          defaultHiddenColumnIds.has(id) &&
          nextVisibility[id] !== false
        ) {
          nextVisibility[id] = false;
          visibilityChanged = true;
        }
      });
      // Only update if there was a change or if we need to apply persisted state
      const needsUpdate =
        visibilityChanged || shouldHydrateFromPersistedVisibility;
      if (needsUpdate) {
        setColumnVisibility(nextVisibility);
      }
      return;
    }

    const visibleFields = metadata.fields.filter(
      (f) => f.visibility !== "hidden",
    );
    const visibleNames = visibleFields.map((field) =>
      toGraphqlFieldName(field.name || field.fieldName),
    );
    resolveColumnOrder(visibleNames);

    const nextVisibility: Record<string, boolean> = { ...effectiveVisibility };
    let visibilityChanged = false;
    visibleFields.forEach((field) => {
      const accessor = toGraphqlFieldName(field.name || field.fieldName);
      if (nextVisibility[accessor] === undefined) {
        nextVisibility[accessor] = !defaultHiddenColumnIds.has(accessor);
        visibilityChanged = true;
        return;
      }
      if (
        shouldForceLegacyHiddenDefaults &&
        defaultHiddenColumnIds.has(accessor) &&
        nextVisibility[accessor] !== false
      ) {
        nextVisibility[accessor] = false;
        visibilityChanged = true;
      }
    });
    const needsUpdate =
      visibilityChanged || shouldHydrateFromPersistedVisibility;
    if (needsUpdate) {
      setColumnVisibility(nextVisibility);
    }
  }, [
    metadata,
    columnDefs,
    columnVisibility,
    setColumnVisibility,
    resolveColumnOrder,
    defaultHiddenColumnIds,
  ]);

  React.useEffect(() => {
    if (!isInfiniteMode) return;
    const container = tableScrollRef.current;
    if (!container) return;

    const threshold = performance?.infiniteScrollThresholdPx ?? 200;
    let ticking = false;

    const maybeLoadMore = () => {
      if (tableLoading) return;
      if (!pagination.hasNextPage) return;
      const distanceToBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      if (distanceToBottom > threshold) return;
      setPage(pagination.page + 1);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        maybeLoadMore();
      });
    };

    container.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", onScroll);
    };
  }, [
    isInfiniteMode,
    pagination.hasNextPage,
    pagination.page,
    performance?.infiniteScrollThresholdPx,
    setPage,
    tableLoading,
  ]);

  if (metadataLoading) {
    return (
      <div
        className="flex h-[400px] w-full flex-col gap-4 p-4 animate-in fade-in duration-500"
        role="status"
        aria-live="polite"
        aria-label="Loading table metadata"
      >
        <div className="flex items-center justify-between">
          <div className="h-10 w-64 animate-pulse rounded-lg bg-muted/40" />
          <div className="flex gap-2">
            <div className="h-10 w-24 animate-pulse rounded-lg bg-muted/40" />
            <div className="h-10 w-24 animate-pulse rounded-lg bg-muted/40" />
          </div>
        </div>
        <div className="flex-1 rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm p-1">
          <div className="h-12 w-full animate-pulse rounded-t-lg bg-muted/60" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-4 p-4 border-b border-border/10">
              <div className="h-4 w-4 animate-pulse rounded bg-muted/40" />
              <div className="h-4 flex-1 animate-pulse rounded bg-muted/30" />
              <div className="h-4 w-24 animate-pulse rounded bg-muted/30" />
              <div className="h-4 w-32 animate-pulse rounded bg-muted/30" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (metadataError) {
    return (
      <div className="flex h-[400px] items-center justify-center p-8">
        <div className="max-w-md w-full rounded-2xl border border-red-200 bg-red-50/30 p-8 text-center backdrop-blur-sm animate-in zoom-in-95 duration-300">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-bold text-red-900">Erreur de métadonnées</h3>
          <p className="text-sm text-red-700/80 leading-relaxed mb-6">
            Impossible de charger les informations de structure pour ce tableau.
            <span className="block mt-1 font-mono text-[10px] opacity-60">{metadataError.message}</span>
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700 active:scale-95"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full max-w-full min-w-0 flex-col overflow-hidden animate-in fade-in duration-700 p-1 sm:p-2">
      <div className="flex-none">
        {children}
      </div>

      <div
        className={cn(
          "flex-1 min-h-0 min-w-0 transition-all duration-300 my-2",
          hideTableOnMobile ? "hidden md:block" : "block"
        )}
      >
        <div className="group/frame relative flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-border/40 bg-card/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] hover:border-border/60">
          <div
            className="flex-1 min-h-0 overflow-auto scroll-smooth custom-scrollbar"
            ref={tableScrollRef}
          >
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <TableFrame className="w-full relative border-separate border-spacing-0">
                <SortableContext
                  items={sortableColumnIds}
                  strategy={horizontalListSortingStrategy}
                >
                  <TableHeader
                    actionsLabel={tableConfig?.actionsLabel}
                    columns={columnDefs ?? undefined}
                    columnOrdering={columnOrdering}
                    disableSorting={disableSorting}
                    enableSelection={resolvedEnableSelection}
                  />
                </SortableContext>
                <TableBody>
                  <TableRows
                    emptyState={tableConfig?.emptyState}
                    loadingText={tableConfig?.loadingText}
                    columns={columnDefs ?? undefined}
                    enableSelection={resolvedEnableSelection}
                    refetch={refetch}
                    columnActions={columnActions}
                    relationStats={relationStats}
                    queryManager={queryManager}
                    performance={performance}
                    scrollContainerRef={tableScrollRef}
                    infiniteMode={isInfiniteMode}
                  />
                </TableBody>
              </TableFrame>
            </DndContext>
          </div>

          {isInfiniteMode ? (
            <div className="mt-auto flex items-center justify-between border-t border-border/30 bg-muted/10 px-6 py-3 text-xs font-medium text-muted-foreground/80 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse" />
                <span>
                  {pagination.totalKnown
                    ? `${data.length} sur ${pagination.total} éléments`
                    : `${data.length} éléments chargés`}
                </span>
              </div>
              {tableLoading ? (
                <span className="inline-flex items-center gap-2 text-primary font-bold">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Chargement...
                </span>
              ) : pagination.hasNextPage ? (
                <span className="opacity-60 flex items-center gap-1.5">
                  <svg className="h-3 w-3 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  Défilez pour plus
                </span>
              ) : (
                <span className="opacity-40 uppercase tracking-widest text-[10px]">Fin de liste</span>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {!isInfiniteMode && (
        <div className="flex-none animate-in slide-in-from-bottom-4 duration-500">
          <TablePagination
            labels={tableConfig?.paginationLabels}
            enableSelection={resolvedEnableSelection}
          />
        </div>
      )}
      
      {dataError && (
        <div className="flex-none flex items-center gap-2 rounded-lg bg-red-50/50 border border-red-100 px-4 py-2 text-xs font-semibold text-red-600 animate-in shake duration-300 mt-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Erreur de données : {dataError.message}
        </div>
      )}
    </div>
  );
}
