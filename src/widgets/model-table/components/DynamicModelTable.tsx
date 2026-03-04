import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ColumnSizingState,
  ExpandedState,
  PaginationState as DynamicPaginationState,
  RowSelectionState,
  VisibilityState,
} from "@tanstack/react-table";
import { useAuthContext } from "@/features/auth/context";
import {
  DynamicTable,
  DYNAMIC_TABLE_SELECTION_COLUMN_ID,
  type DynamicTableColumnInput,
} from "@/widgets/dynamic-table";
import { createInitialFilterState } from "@/widgets/model-table/filtering/state";
import type { DynamicTableFeatureFlags } from "@/widgets/dynamic-table";
import { TooltipProvider } from "@/shared/ui/kit/tooltip";
import { cn } from "@/shared/utils";
import { MetadataProvider, useMetadata } from "../context/MetadataContext";
import { TableProvider, useTable } from "../context/TableContext";
import type {
  BaseModelTableColumnActionsInput,
  BaseModelTableColumnDef,
  BaseModelTableColumnOrderingConfig,
  BaseModelTableFieldsInput,
  BaseModelTableRefetch,
  BaseModelTableRelationConfig,
  BaseModelTableRelationStatsConfig,
  FieldSchema,
  RowMutationPermissions,
} from "../types";
import type {
  DynamicModelTableDevtoolsConfig,
  DynamicModelTableHandle,
  DynamicModelTableInitVariables,
  DynamicModelTableProps,
  DynamicModelTableSnapshot,
  ModelTableCreateConfig,
  ModelTableDetailConfig,
  ModelTableFilterPanelProps,
  ModelTableUpdateConfig,
  ModelTableV2ExpandConfig,
  ModelTableV2TopActionsInput,
  ModelTableV2PerformanceOptions,
  ModelTableV2TableConfig,
  ModelTableV2ViewOptions,
} from "../config/types";
import {
  loadPersistedTableState,
  type PersistedTableState,
  useTablePersistence,
} from "../hooks/useTablePersistence";
import { useTableColumns } from "../hooks/useTableColumns";
import { useTableData } from "../hooks/useTableData";
import { useTableLayout } from "../hooks/useTableLayout";
import { useTableQueryConfig } from "../hooks/useTableQueryConfig";
import { useTableFilters } from "../hooks/useTableFilters";
import { ColumnFilter } from "./ColumnFilter";
import { RowActions } from "./row/RowActions";
import {
  useModelTableContentController,
  type UseModelTableContentControllerInput,
} from "./content/useModelTableContentController";
import { ModelTableBulkActionsBar } from "./content/ModelTableBulkActionsBar";
import { ModelTableDialogs } from "./content/ModelTableDialogs";
import { ModelTableFooter } from "./content/ModelTableFooter";
import { ModelTableHeader } from "./content/ModelTableHeader";
import { ModelTableToolbarSection } from "./content/ModelTableToolbarSection";
import { ModelTableTopActions } from "./content/ModelTableTopActions";
import type {
  ModelTableContentConfig,
  ModelTableContentSectionVisibility,
  ModelTableTopActionsSlotProps,
} from "./content/types";
import {
  RelationStatsHover,
  type StatsRelationMeta,
} from "./row/RelationStatsHover";
import { TableColumnMenu } from "./TableColumnMenu";
import { TableMobileCard } from "./TableMobileCard";
import { TablePagination } from "./TablePagination";
import {
  formatCellValue,
  getDefaultHiddenColumnIds,
  getSyntheticRelationCountSource,
  toGraphqlFieldName,
} from "../utils";
import {
  buildAccessorPath,
  resolveValueOptimized,
} from "../utils/valueResolution";

/**
 * Internal props used by the dynamic-table powered content implementation.
 */
type DynamicBaseTableContentProps = {
  persistenceKey?: string;
  filterPanel?: ModelTableFilterPanelProps;
  create?: ModelTableCreateConfig;
  update?: ModelTableUpdateConfig;
  detail?: ModelTableDetailConfig;
  tableConfig?: ModelTableV2TableConfig;
  view?: ModelTableV2ViewOptions;
  performance?: ModelTableV2PerformanceOptions;
  quickSearch?: boolean;
  topActions?: ModelTableV2TopActionsInput;
  content?: ModelTableContentConfig;
  hideTableOnMobile?: boolean;
  fields?: BaseModelTableFieldsInput;
  relations?: Record<string, BaseModelTableRelationConfig>;
  relationStats?: BaseModelTableRelationStatsConfig;
  queryManager?: string;
  columnOrdering?: BaseModelTableColumnOrderingConfig;
  skipCount?: boolean;
  disableSorting?: boolean;
  enableSelection?: boolean;
  expand?: ModelTableV2ExpandConfig;
  columnActions?: BaseModelTableColumnActionsInput;
  devtoolsEnabled?: boolean;
  /**
   * Emits the current query refetch function to the parent wrapper.
   */
  onRefetchResolved?: (refetch?: BaseModelTableRefetch) => void;
  /**
   * Emits a runtime snapshot whenever table state changes.
   */
  onSnapshotResolved?: (snapshot: DynamicModelTableSnapshot) => void;
};

/**
 * Default section visibility when no content.show overrides are provided.
 */
const DEFAULT_SECTION_VISIBILITY: Required<ModelTableContentSectionVisibility> =
  {
    header: true,
    topActions: true,
    toolbar: true,
    bulkActionsBar: true,
    footer: false,
    dialogs: true,
  };

/**
 * Default backend sort when no explicit user order is provided.
 * Keeps newest records first.
 */
const DEFAULT_BACKEND_ORDER_BY = ["-id"] as const;

type TableDevtoolsTimings = {
  metadataFetchMs: number | null;
  dataFetchMs: number | null;
  tableBuildMs: number | null;
};

function getMonotonicNow(): number {
  if (
    typeof performance !== "undefined" &&
    typeof performance.now === "function"
  ) {
    return performance.now();
  }
  return Date.now();
}

function formatTimingMs(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "--";
  }
  if (value <= 0) {
    return "0 ms";
  }
  return `${Math.max(1, Math.ceil(value))} ms`;
}

function resolveDevtoolsEnabled(
  devtools?: boolean | DynamicModelTableDevtoolsConfig,
): boolean {
  if (typeof devtools === "boolean") {
    return devtools;
  }
  return devtools?.enabled ?? false;
}

/**
 * Resolves effective section visibility from defaults and optional overrides.
 */
function resolveSectionVisibility(
  visibility?: ModelTableContentSectionVisibility,
): Required<ModelTableContentSectionVisibility> {
  return {
    ...DEFAULT_SECTION_VISIBILITY,
    ...(visibility ?? {}),
  };
}

/**
 * Empty top-actions renderer used when topActions are intentionally hidden.
 */
const HiddenTopActions: (
  props: ModelTableTopActionsSlotProps,
) => React.ReactNode = () => null;

/**
 * Returns true when the input is a plain object record.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Extracts a backend permission codename from GraphQL errors.
 */
function extractPermissionCodeFromMessage(message: string): string | null {
  const match = message.match(/Permission required:\s*([a-z0-9_.-]+)/i);
  return match?.[1] ?? null;
}

/**
 * Localizes technical GraphQL errors into user-facing French text.
 */
function localizeTableErrorMessage(error: Error): string {
  const rawMessage = error.message || "Une erreur est survenue.";
  const permissionCode = extractPermissionCodeFromMessage(rawMessage);
  if (permissionCode) {
    return `Acces refuse : permission requise (${permissionCode}).`;
  }
  return rawMessage;
}

/**
 * Converts unknown filter-variable order input to a normalized string array.
 */
function toOrderByEntries(value: unknown): string[] {
  if (!Array.isArray(value)) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed ? [trimmed] : [];
    }
    return [];
  }
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/**
 * Resolves order-by input and falls back to default descending id ordering.
 */
function resolveOrderByWithFallback(value: unknown): string[] {
  const normalized = toOrderByEntries(value);
  if (normalized.length > 0) {
    return normalized;
  }
  return [...DEFAULT_BACKEND_ORDER_BY];
}

/**
 * Normalizes unknown input to a trimmed string-array payload.
 */
function toStringEntries(value: unknown): string[] {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/**
 * Normalizes unknown numeric input to a positive integer.
 */
function toPositiveInteger(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  return Math.floor(value);
}

type ResolvedInitialTableState = {
  page: number;
  perPage: number;
  filterVariables: Record<string, unknown>;
  advancedFilters: ReturnType<typeof createInitialFilterState>;
};

/**
 * Normalizes DynamicModelTable initVariables into table-provider initial state.
 */
function resolveInitialTableState(
  initVariables?: DynamicModelTableInitVariables,
): ResolvedInitialTableState {
  const filterVariables = isRecord(initVariables) ? { ...initVariables } : {};

  const page = toPositiveInteger(filterVariables.page) ?? 1;
  const perPage =
    toPositiveInteger(filterVariables.perPage ?? filterVariables.per_page) ??
    20;
  delete filterVariables.page;
  delete filterVariables.perPage;
  delete filterVariables.per_page;

  const normalizedPresets = (() => {
    const explicitPresets = toStringEntries(filterVariables.presets);
    if (explicitPresets.length > 0) {
      return explicitPresets;
    }
    return toStringEntries(filterVariables.preset);
  })();
  if (normalizedPresets.length > 0) {
    filterVariables.presets = normalizedPresets;
  } else {
    delete filterVariables.presets;
  }
  delete filterVariables.preset;

  const normalizedDistinctOn = toStringEntries(filterVariables.distinctOn);
  if (normalizedDistinctOn.length > 0) {
    filterVariables.distinctOn = normalizedDistinctOn;
  } else {
    delete filterVariables.distinctOn;
  }

  const normalizedOrderBy = resolveOrderByWithFallback(
    filterVariables.orderBy ?? filterVariables.order_by,
  );
  filterVariables.orderBy = normalizedOrderBy;
  delete filterVariables.order_by;

  const advancedFilters = createInitialFilterState();
  advancedFilters.selectedPresets = normalizedPresets;
  advancedFilters.distinctOn = normalizedDistinctOn;
  advancedFilters.orderBy = normalizedOrderBy;

  return {
    page,
    perPage,
    filterVariables,
    advancedFilters,
  };
}

/**
 * Compares two string arrays for exact ordered equality.
 */
function areStringArraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }
  return true;
}

/**
 * Compares two boolean record maps for exact key/value equality.
 */
function areBooleanMapsEqual(
  left: Record<string, boolean>,
  right: Record<string, boolean>,
): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const key of leftKeys) {
    if (left[key] !== right[key]) {
      return false;
    }
  }
  return true;
}

/**
 * Compares two number record maps for exact key/value equality.
 */
function areNumberMapsEqual(
  left: Record<string, number>,
  right: Record<string, number>,
): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const key of leftKeys) {
    if (left[key] !== right[key]) {
      return false;
    }
  }
  return true;
}

/**
 * Serializes unknown values into a deterministic string key.
 */
function stableSerializeUnknown(value: unknown): string {
  try {
    return JSON.stringify(value ?? null);
  } catch {
    return String(value);
  }
}

/**
 * Compares persisted table snapshots for structural equality.
 */
function isPersistedTableStateEqual(
  left: PersistedTableState | null,
  right: PersistedTableState | null,
): boolean {
  if (left === right) {
    return true;
  }
  if (!left || !right) {
    return left === right;
  }

  return (
    areStringArraysEqual(left.columnOrder, right.columnOrder) &&
    areBooleanMapsEqual(left.columnVisibility, right.columnVisibility) &&
    areNumberMapsEqual(left.columnWidths ?? {}, right.columnWidths ?? {}) &&
    left.perPage === right.perPage &&
    left.density === right.density &&
    left.wrapCells === right.wrapCells &&
    (left.visibilityVersion ?? 0) === (right.visibilityVersion ?? 0)
  );
}

/**
 * Compares TanStack pagination objects.
 */
function isPaginationStateEqual(
  left: DynamicPaginationState,
  right: DynamicPaginationState,
): boolean {
  return left.pageIndex === right.pageIndex && left.pageSize === right.pageSize;
}

/**
 * Compares expanded-state snapshots.
 */
function isExpandedStateEqual(
  left: ExpandedState,
  right: ExpandedState,
): boolean {
  if (left === right) {
    return true;
  }
  if (typeof left === "boolean" || typeof right === "boolean") {
    return left === right;
  }
  return areBooleanMapsEqual(left, right);
}

/**
 * Resolves a fallback cell string for unknown values.
 */
function formatFallbackCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Resolves one row id from primary key metadata with safe fallback.
 */
function resolveRowId(
  row: Record<string, unknown>,
  index: number,
  primaryKey: string,
): string {
  const candidate = row[primaryKey] ?? row.id;
  if (typeof candidate === "string" || typeof candidate === "number") {
    return String(candidate);
  }
  return String(index);
}

/**
 * Dynamic, feature-parity table content implemented with DynamicTable as the desktop grid.
 */
function DynamicBaseTableContent({
  persistenceKey,
  filterPanel,
  create,
  update,
  detail,
  tableConfig,
  quickSearch,
  topActions,
  content,
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
  expand,
  columnActions,
  devtoolsEnabled = false,
  onRefetchResolved,
  onSnapshotResolved,
}: DynamicBaseTableContentProps) {
  const { user } = useAuthContext();
  const {
    metadata,
    loading: metadataLoading,
    error: metadataError,
    app,
    model,
    capabilitiesLoading,
    capabilitiesLoaded,
    scheduleCapabilitiesPrefetch,
  } = useMetadata();
  const {
    columnVisibility,
    columnWidths,
    columnOrder,
    rowSelection,
    groupingField,
    groupCollapsed,
    dragModeEnabled,
    density,
    wrapCells,
    setColumnVisibility,
    setColumnWidths,
    setColumnOrder,
    setRowSelection,
    setPage,
    setPerPage,
    setDragModeEnabled,
    setDensity,
    setWrapCells,
    loading: tableLoading,
    data,
    queryPage,
    pagination,
    error: dataError,
  } = useTable();
  const { advancedFilters, filterVariables, setAdvancedFilters } =
    useTableFilters();

  const [dynamicExpanded, setDynamicExpanded] = useState<ExpandedState>({});
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const isInfiniteMode = performance?.dataMode === "infinite";
  const [timings, setTimings] = useState<TableDevtoolsTimings>({
    metadataFetchMs: null,
    dataFetchMs: null,
    tableBuildMs: null,
  });
  const metadataFetchStartedAtRef = useRef<number | null>(null);
  const dataFetchStartedAtRef = useRef<number | null>(null);
  const buildFrameRequestRef = useRef<number | null>(null);

  const scheduleBuildMeasure = useCallback(() => {
    if (!devtoolsEnabled) {
      return;
    }

    const buildStartedAt = getMonotonicNow();
    if (
      typeof window === "undefined" ||
      typeof window.requestAnimationFrame !== "function"
    ) {
      setTimings((previous) =>
        previous.tableBuildMs === 0
          ? previous
          : { ...previous, tableBuildMs: 0 },
      );
      return;
    }

    if (buildFrameRequestRef.current !== null) {
      window.cancelAnimationFrame(buildFrameRequestRef.current);
    }

    buildFrameRequestRef.current = window.requestAnimationFrame(() => {
      buildFrameRequestRef.current = null;
      const nextBuildMs = getMonotonicNow() - buildStartedAt;
      setTimings((previous) => ({
        ...previous,
        tableBuildMs: nextBuildMs,
      }));
    });
  }, [devtoolsEnabled]);

  useEffect(() => {
    return () => {
      if (
        typeof window !== "undefined" &&
        buildFrameRequestRef.current !== null &&
        typeof window.cancelAnimationFrame === "function"
      ) {
        window.cancelAnimationFrame(buildFrameRequestRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (
      devtoolsEnabled ||
      typeof window === "undefined" ||
      buildFrameRequestRef.current === null ||
      typeof window.cancelAnimationFrame !== "function"
    ) {
      return;
    }
    window.cancelAnimationFrame(buildFrameRequestRef.current);
    buildFrameRequestRef.current = null;
  }, [devtoolsEnabled]);

  useEffect(() => {
    if (!devtoolsEnabled) {
      return;
    }
    metadataFetchStartedAtRef.current = getMonotonicNow();
    setTimings((previous) => ({
      ...previous,
      metadataFetchMs: null,
    }));
  }, [app, devtoolsEnabled, model]);

  useEffect(() => {
    if (!devtoolsEnabled) {
      metadataFetchStartedAtRef.current = null;
      return;
    }
    if (metadataLoading) {
      if (metadataFetchStartedAtRef.current === null) {
        metadataFetchStartedAtRef.current = getMonotonicNow();
      }
      return;
    }

    if (metadataFetchStartedAtRef.current !== null) {
      const nextMetadataFetchMs =
        getMonotonicNow() - metadataFetchStartedAtRef.current;
      metadataFetchStartedAtRef.current = null;
      setTimings((previous) => ({
        ...previous,
        metadataFetchMs: nextMetadataFetchMs,
      }));
      return;
    }
  }, [devtoolsEnabled, metadata, metadataError, metadataLoading]);

  useEffect(() => {
    if (!devtoolsEnabled) {
      dataFetchStartedAtRef.current = null;
      return;
    }
    if (tableLoading) {
      if (dataFetchStartedAtRef.current === null) {
        dataFetchStartedAtRef.current = getMonotonicNow();
      }
      return;
    }

    if (dataFetchStartedAtRef.current === null) {
      return;
    }

    const nextDataFetchMs = getMonotonicNow() - dataFetchStartedAtRef.current;
    dataFetchStartedAtRef.current = null;
    setTimings((previous) => ({
      ...previous,
      dataFetchMs: nextDataFetchMs,
    }));
    scheduleBuildMeasure();
  }, [devtoolsEnabled, scheduleBuildMeasure, tableLoading]);

  const locationPath =
    typeof window !== "undefined" ? window.location.pathname : "";
  const effectiveKey = persistenceKey || `${app}-${model}-${locationPath}`;
  const { hydrated: persistenceHydrated } = useTablePersistence(effectiveKey);

  const rawUserTableConfigs = useMemo(() => {
    const settings = user?.settings as
      | { table_configs?: unknown; tableConfigs?: unknown }
      | undefined;
    return settings?.table_configs ?? settings?.tableConfigs ?? null;
  }, [user?.settings]);

  const userTableConfigsSignature = useMemo(
    () => stableSerializeUnknown(rawUserTableConfigs),
    [rawUserTableConfigs],
  );
  const stableRawUserTableConfigs = useMemo(
    () => rawUserTableConfigs,
    [userTableConfigsSignature],
  );

  const rawPersistedState = useMemo(
    () =>
      loadPersistedTableState(effectiveKey, stableRawUserTableConfigs, {
        allowLocalFallback: true,
      }),
    [effectiveKey, stableRawUserTableConfigs],
  );
  const persistedStateRef = useRef<PersistedTableState | null>(null);
  const persistedState = useMemo(() => {
    if (
      isPersistedTableStateEqual(rawPersistedState, persistedStateRef.current)
    ) {
      return persistedStateRef.current;
    }
    persistedStateRef.current = rawPersistedState;
    return rawPersistedState;
  }, [rawPersistedState]);

  const { columnDefs, normalizedFieldsConfig, excludedAccessors } =
    useTableColumns({
      metadata,
      fields,
      relations,
      columnVisibility,
      persistedVisibility: persistedState?.columnVisibility,
    });

  const defaultHiddenColumnIds = useMemo(() => {
    if (normalizedFieldsConfig.include !== undefined) {
      return new Set<string>();
    }
    const hidden = getDefaultHiddenColumnIds(metadata);
    normalizedFieldsConfig.add.forEach((entry: { accessor: string }) => {
      const root = entry.accessor.split(".")[0].split("__")[0];
      hidden.delete(root);
      hidden.delete(entry.accessor);
    });
    return hidden;
  }, [metadata, normalizedFieldsConfig]);

  const { queryConfig } = useTableQueryConfig({
    fields,
    relations,
    queryManager,
    skipCount,
    performance,
    normalizedFieldsConfig,
    excludedAccessors,
    defaultHiddenColumnIds,
    persistedVisibility: persistedState?.columnVisibility,
  });

  const dataConfig = useMemo(
    () => ({
      ...queryConfig,
      enabled: persistenceHydrated,
    }),
    [persistenceHydrated, queryConfig],
  );
  const { refetch } = useTableData(dataConfig);
  useEffect(() => {
    onRefetchResolved?.(refetch as BaseModelTableRefetch | undefined);
    return () => {
      onRefetchResolved?.(undefined);
    };
  }, [onRefetchResolved, refetch]);

  const hasScheduledCapabilitiesRef = useRef(false);
  useEffect(() => {
    if (hasScheduledCapabilitiesRef.current) {
      return;
    }
    if (!persistenceHydrated || metadataLoading || !metadata) {
      return;
    }
    if (capabilitiesLoaded || capabilitiesLoading) {
      hasScheduledCapabilitiesRef.current = true;
      return;
    }

    // Prefetch capabilities in idle time so first paint/data query are not
    // contending with heavier capability metadata work.
    hasScheduledCapabilitiesRef.current = true;
    scheduleCapabilitiesPrefetch();
  }, [
    capabilitiesLoaded,
    capabilitiesLoading,
    metadata,
    metadataLoading,
    persistenceHydrated,
    scheduleCapabilitiesPrefetch,
  ]);

  const { allowColumnDrag, lockedColumns } = useTableLayout({
    columnDefs,
    columnOrdering,
    defaultHiddenColumnIds,
    persistedState,
  });

  const resolvedEnableSelection = useMemo(() => {
    // Keep selection behavior deterministic to avoid late UI column toggles.
    if (typeof enableSelection === "boolean") {
      return enableSelection;
    }
    return true;
  }, [enableSelection]);
  const rowDetailExpandEnabled = useMemo(() => {
    const requested = expand?.enabled ?? Boolean(expand?.renderRow);
    return requested && Boolean(expand?.renderRow);
  }, [expand]);

  const primaryKey = metadata?.primaryKey || "id";
  const selectedRows = useMemo(() => {
    const selectedRowIds = new Set(
      Object.entries(rowSelection)
        .filter(([, isSelected]) => isSelected)
        .map(([rowId]) => rowId),
    );
    if (selectedRowIds.size === 0) {
      return [];
    }
    return data.filter((row, index) =>
      selectedRowIds.has(resolveRowId(row, index, primaryKey)),
    );
  }, [data, primaryKey, rowSelection]);
  const whereType =
    metadata?.filterConfig?.inputTypeName ||
    `${metadata?.model || "Model"}WhereInput`;

  useEffect(() => {
    if (!onSnapshotResolved) {
      return;
    }
    onSnapshotResolved({
      data,
      selectedRows,
      rowSelection,
      loading: tableLoading,
      metadataLoading,
      dataError: dataError ?? null,
      metadataError: metadataError ?? null,
      metadata: metadata ?? null,
      pagination,
    });
  }, [
    data,
    dataError,
    metadata,
    metadataError,
    metadataLoading,
    onSnapshotResolved,
    pagination,
    rowSelection,
    selectedRows,
    tableLoading,
  ]);

  const orderBy = useMemo(() => {
    const variableOrderBy = isRecord(filterVariables)
      ? toOrderByEntries(filterVariables.orderBy)
      : [];
    if (variableOrderBy.length > 0) {
      return variableOrderBy;
    }
    return resolveOrderByWithFallback(advancedFilters.orderBy);
  }, [advancedFilters.orderBy, filterVariables]);

  const fieldLookup = useMemo(() => {
    const lookup = new Map<string, FieldSchema>();
    if (!metadata?.fields) {
      return lookup;
    }

    metadata.fields.forEach((field) => {
      const normalizedName = toGraphqlFieldName(field.name || field.fieldName);
      const normalizedFieldName = field.fieldName
        ? toGraphqlFieldName(field.fieldName)
        : undefined;

      [field.name, field.fieldName, normalizedName, normalizedFieldName]
        .filter((entry): entry is string => !!entry)
        .forEach((entry) => {
          lookup.set(entry, field);
        });
    });

    return lookup;
  }, [metadata?.fields]);

  const relationLookup = useMemo(() => {
    const lookup = new Map<
      string,
      {
        relatedApp: string;
        relatedModel: string;
        relationName: string;
        relationLabel: string;
        isToMany: boolean;
      }
    >();
    if (!metadata?.relationships) {
      return lookup;
    }

    metadata.relationships.forEach((relation) => {
      const normalizedName = toGraphqlFieldName(
        relation.name || relation.fieldName,
      );
      const normalizedFieldName = relation.fieldName
        ? toGraphqlFieldName(relation.fieldName)
        : undefined;
      const descriptor = {
        relatedApp: relation.relatedApp,
        relatedModel: relation.relatedModel,
        relationName: relation.fieldName || relation.name,
        relationLabel: relation.verboseName || relation.name,
        isToMany: Boolean(relation.isToMany),
      };

      [relation.name, relation.fieldName, normalizedName, normalizedFieldName]
        .filter((entry): entry is string => !!entry)
        .forEach((entry) => {
          lookup.set(entry, descriptor);
        });
    });

    return lookup;
  }, [metadata?.relationships]);

  const accessorPathLookup = useMemo(() => {
    const paths = new Map<string, string[]>();
    (columnDefs ?? []).forEach((column) => {
      paths.set(column.accessor, buildAccessorPath(column.accessor));
    });
    return paths;
  }, [columnDefs]);

  const resolveStatsRelation = useCallback(
    (column: BaseModelTableColumnDef): StatsRelationMeta | null => {
      if (!relationStats?.enabled) {
        return null;
      }

      const columnRoot = column.accessor.replace(/__/g, ".").split(".")[0];
      const fieldMeta = fieldLookup.get(columnRoot);
      const syntheticSource = fieldMeta
        ? getSyntheticRelationCountSource(fieldMeta)
        : undefined;
      const relationSource = fieldMeta?.isRelation
        ? fieldMeta.name || fieldMeta.fieldName
        : syntheticSource || columnRoot;
      if (!relationSource) {
        return null;
      }

      const relationMeta = relationLookup.get(relationSource);
      if (!relationMeta || !relationMeta.isToMany) {
        return null;
      }

      if (
        relationStats.include &&
        !relationStats.include.includes(column.id) &&
        !relationStats.include.includes(columnRoot) &&
        !relationStats.include.includes(relationMeta.relationName)
      ) {
        return null;
      }
      if (
        relationStats.exclude &&
        (relationStats.exclude.includes(column.id) ||
          relationStats.exclude.includes(columnRoot) ||
          relationStats.exclude.includes(relationMeta.relationName))
      ) {
        return null;
      }

      return {
        relationName: relationMeta.relationName,
        relationLabel: relationMeta.relationLabel,
        relatedApp: relationMeta.relatedApp,
        relatedModel: relationMeta.relatedModel,
      };
    },
    [fieldLookup, relationLookup, relationStats],
  );

  const resolveStatsOverride = useCallback(
    (columnId: string, relationName: string) => {
      return (
        relationStats?.overrides?.[columnId] ||
        relationStats?.overrides?.[relationName]
      );
    },
    [relationStats?.overrides],
  );

  const dynamicColumns = useMemo<
    DynamicTableColumnInput<Record<string, unknown>>[]
  >(() => {
    if (!columnDefs) {
      return [];
    }

    return columnDefs.map((column) => {
      const sortKey = column.id.replace(/\./g, "__");
      const accessorPath =
        accessorPathLookup.get(column.accessor) ??
        buildAccessorPath(column.accessor);

      return {
        id: column.id,
        headerMode: "custom",
        title: column.title,
        accessorFn: (row) => resolveValueOptimized(row, accessorPath),
        sortKey,
        enableSorting: disableSorting ? false : true,
        size: columnWidths[column.id],
        header: () => (
          <div className="flex h-full w-full items-stretch self-stretch">
            <div className="min-w-0 flex-1 h-full">
              <TableColumnMenu
                columnId={column.id}
                title={column.title}
                disabled={disableSorting}
                fullWidthTrigger
                variant="default"
              />
            </div>
            <ColumnFilter columnId={column.id} hideTrigger />
          </div>
        ),
        cell: ({ row, value }) => {
          const renderedValue = column.render
            ? column.render(value, row, {
                accessor: column.accessor,
                columnId: column.id,
                data,
                refetch: refetch as BaseModelTableRefetch | undefined,
              })
            : (() => {
                const root = column.accessor.replace(/__/g, ".").split(".")[0];
                const field = fieldLookup.get(root);
                if (field) {
                  return formatCellValue(value, field);
                }
                return formatFallbackCellValue(value);
              })();

          const statsRelation = resolveStatsRelation(column);
          if (!statsRelation) {
            return renderedValue;
          }

          const overrideRenderer = resolveStatsOverride(
            column.id,
            statsRelation.relationName,
          );
          return (
            <RelationStatsHover
              row={row}
              primaryKey={primaryKey}
              model={metadata?.model || "Model"}
              whereType={whereType}
              relation={statsRelation}
              queryManager={queryManager}
              overrideRenderer={overrideRenderer}
            >
              <span className="cursor-pointer hover:text-primary transition-colors underline-offset-4 decoration-primary/30 hover:underline">
                {renderedValue}
              </span>
            </RelationStatsHover>
          );
        },
      };
    });
  }, [
    accessorPathLookup,
    columnDefs,
    columnWidths,
    data,
    disableSorting,
    fieldLookup,
    metadata?.model,
    primaryKey,
    queryManager,
    refetch,
    resolveStatsOverride,
    resolveStatsRelation,
    whereType,
  ]);

  const selectedPaginationState = useMemo<DynamicPaginationState>(
    () => ({
      pageIndex: Math.max(0, pagination.page - 1),
      pageSize: pagination.perPage,
    }),
    [pagination.page, pagination.perPage],
  );

  const features = useMemo<DynamicTableFeatureFlags>(
    () => ({
      enableSelection: resolvedEnableSelection,
      enableColumnOrdering: allowColumnDrag,
      enableColumnResizing: true,
      enableColumnHiding: true,
      enableGrouping: true,
      enableVirtualization: performance?.enableVirtualization ?? true,
      virtualizeThreshold: performance?.virtualizeThreshold ?? 50,
      overscan: performance?.overscan ?? 10,
      dataMode: isInfiniteMode ? "infinite" : "pagination",
      enablePagination: false,
      infiniteScrollThresholdPx: performance?.infiniteScrollThresholdPx ?? 200,
      lockedColumnIds: Array.from(lockedColumns),
    }),
    [
      allowColumnDrag,
      isInfiniteMode,
      lockedColumns,
      performance?.enableVirtualization,
      performance?.infiniteScrollThresholdPx,
      performance?.overscan,
      performance?.virtualizeThreshold,
      resolvedEnableSelection,
    ],
  );

  const handleOrderByChange = useCallback(
    (nextOrderBy: string[]) => {
      const normalizedNextOrderBy = resolveOrderByWithFallback(nextOrderBy);
      const currentVariablesOrderBy = resolveOrderByWithFallback(
        isRecord(filterVariables) ? filterVariables.orderBy : undefined,
      );
      if (
        areStringArraysEqual(normalizedNextOrderBy, advancedFilters.orderBy) &&
        areStringArraysEqual(normalizedNextOrderBy, currentVariablesOrderBy)
      ) {
        return;
      }

      const nextVariables = isRecord(filterVariables)
        ? { ...filterVariables }
        : {};
      nextVariables.orderBy = normalizedNextOrderBy;

      setAdvancedFilters(
        {
          ...advancedFilters,
          orderBy: normalizedNextOrderBy,
        },
        nextVariables,
      );
    },
    [advancedFilters, filterVariables, setAdvancedFilters],
  );

  const handleStateChange = useCallback(
    (nextState: {
      columnOrder: string[];
      columnVisibility: VisibilityState;
      columnSizing: ColumnSizingState;
      rowSelection: RowSelectionState;
      pagination: DynamicPaginationState;
      dragModeEnabled: boolean;
      density: "compact" | "comfortable" | "spacious";
      wrapCells: boolean;
      expanded: ExpandedState;
    }) => {
      if (!areStringArraysEqual(nextState.columnOrder, columnOrder)) {
        setColumnOrder(nextState.columnOrder);
      }

      if (!areBooleanMapsEqual(nextState.columnVisibility, columnVisibility)) {
        setColumnVisibility(nextState.columnVisibility);
      }

      if (!areNumberMapsEqual(nextState.columnSizing, columnWidths)) {
        setColumnWidths(nextState.columnSizing);
      }

      if (!areBooleanMapsEqual(nextState.rowSelection, rowSelection)) {
        setRowSelection(nextState.rowSelection);
      }

      if (
        !isPaginationStateEqual(nextState.pagination, selectedPaginationState)
      ) {
        if (nextState.pagination.pageSize !== pagination.perPage) {
          setPerPage(nextState.pagination.pageSize);
        }
        const nextPage = nextState.pagination.pageIndex + 1;
        if (nextPage !== pagination.page) {
          setPage(nextPage);
        }
      }

      if (nextState.dragModeEnabled !== dragModeEnabled) {
        setDragModeEnabled(nextState.dragModeEnabled);
      }

      if (nextState.density !== density) {
        setDensity(nextState.density);
      }

      if (nextState.wrapCells !== wrapCells) {
        setWrapCells(nextState.wrapCells);
      }

      if (!isExpandedStateEqual(nextState.expanded, dynamicExpanded)) {
        setDynamicExpanded(nextState.expanded);
      }
    },
    [
      columnOrder,
      columnVisibility,
      columnWidths,
      density,
      dragModeEnabled,
      dynamicExpanded,
      pagination.page,
      pagination.perPage,
      rowSelection,
      selectedPaginationState,
      setColumnOrder,
      setColumnVisibility,
      setColumnWidths,
      setDensity,
      setDragModeEnabled,
      setPage,
      setPerPage,
      setRowSelection,
      setWrapCells,
      wrapCells,
    ],
  );

  const handleRowSelectionChange = useCallback(
    (nextSelection: RowSelectionState) => {
      if (!areBooleanMapsEqual(nextSelection, rowSelection)) {
        setRowSelection(nextSelection);
      }
    },
    [rowSelection, setRowSelection],
  );

  const handlePaginationChange = useCallback(
    (nextPagination: DynamicPaginationState) => {
      if (nextPagination.pageSize !== pagination.perPage) {
        setPerPage(nextPagination.pageSize);
      }
      const nextPage = nextPagination.pageIndex + 1;
      if (nextPage !== pagination.page) {
        setPage(nextPage);
      }
    },
    [pagination.page, pagination.perPage, setPage, setPerPage],
  );

  const dynamicState = useMemo(
    () => ({
      orderBy,
      columnOrder: resolvedEnableSelection
        ? [
            DYNAMIC_TABLE_SELECTION_COLUMN_ID,
            ...columnOrder.filter(
              (columnId) => columnId !== DYNAMIC_TABLE_SELECTION_COLUMN_ID,
            ),
          ]
        : columnOrder,
      columnVisibility,
      columnSizing: columnWidths,
      rowSelection,
      grouping: groupingField ? [groupingField] : [],
      expanded: dynamicExpanded,
      pagination: selectedPaginationState,
      dragModeEnabled,
      density,
      wrapCells,
    }),
    [
      columnOrder,
      columnVisibility,
      columnWidths,
      density,
      dragModeEnabled,
      dynamicExpanded,
      groupingField,
      orderBy,
      resolvedEnableSelection,
      rowSelection,
      selectedPaginationState,
      wrapCells,
    ],
  );

  useEffect(() => {
    if (!groupingField) {
      if (!rowDetailExpandEnabled) {
        setDynamicExpanded({});
      }
      return;
    }

    if (!groupCollapsed || Object.keys(groupCollapsed).length === 0) {
      setDynamicExpanded(true);
      return;
    }

    const collapsedValues = Object.values(groupCollapsed);
    if (collapsedValues.every((value) => value === true)) {
      setDynamicExpanded({});
      return;
    }
    if (collapsedValues.every((value) => value === false)) {
      setDynamicExpanded(true);
    }
  }, [groupCollapsed, groupingField, rowDetailExpandEnabled]);

  const sectionControllerInput: UseModelTableContentControllerInput = {
    filterPanel,
    create,
    tableConfig,
    quickSearch,
    fields,
    topActions,
  };
  const sectionController = useModelTableContentController(
    sectionControllerInput,
  );
  const sectionVisibility = resolveSectionVisibility(content?.show);
  const HeaderSlot = content?.slots?.Header ?? ModelTableHeader;
  const TopActionsSlot = content?.slots?.TopActions ?? ModelTableTopActions;
  const ToolbarSlot = content?.slots?.Toolbar ?? ModelTableToolbarSection;
  const BulkActionsBarSlot =
    content?.slots?.BulkActionsBar ?? ModelTableBulkActionsBar;
  const FooterSlot = content?.slots?.Footer ?? ModelTableFooter;
  const DialogsSlot = content?.slots?.Dialogs ?? ModelTableDialogs;
  const headerTopActionsSlot = sectionVisibility.topActions
    ? TopActionsSlot
    : HiddenTopActions;
  const showStandaloneTopActions =
    !sectionVisibility.header && sectionVisibility.topActions;

  if (metadataLoading) {
    return <LoadingSkeleton />;
  }
  if (metadataError) {
    return <ErrorState error={metadataError} />;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="relative flex h-full w-full max-w-full min-w-0 flex-col overflow-hidden animate-in fade-in duration-500 bg-card border border-border/50 shadow-md shadow-black/5 sm:rounded-xl"
        data-model-table-persistence-key={effectiveKey}
      >
        {devtoolsEnabled && <TableDevtoolsPanel timings={timings} />}
        {sectionController.metadata && (
          <div className="flex-none bg-card/90 border-b border-border/40 backdrop-blur-md z-20 shrink-0">
            <div className="flex flex-col w-full">
              {sectionVisibility.header && (
                <HeaderSlot
                  controller={sectionController}
                  TopActionsComponent={headerTopActionsSlot}
                />
              )}

              {showStandaloneTopActions && (
                <div className="flex w-full justify-end px-5 py-3 border-t border-border/20 bg-muted/10">
                  <TopActionsSlot controller={sectionController} />
                </div>
              )}

              {sectionVisibility.toolbar && (
                <div className="border-t border-border/20 bg-card px-5 py-3 sm:px-6">
                  <ToolbarSlot controller={sectionController} />
                </div>
              )}
              {sectionVisibility.bulkActionsBar && (
                <div className="px-5 py-2 border-t border-border/30 bg-primary/5">
                  <BulkActionsBarSlot controller={sectionController} />
                </div>
              )}
              {sectionVisibility.footer && (
                <FooterSlot controller={sectionController} />
              )}
            </div>
          </div>
        )}

        {hideTableOnMobile && (
          <div className="flex-1 min-h-0 min-w-0 md:hidden bg-background">
            <TableMobileCard
              emptyState={tableConfig?.emptyState}
              refetch={refetch}
              columnActions={columnActions}
              update={update}
              detail={detail}
            />
          </div>
        )}

        <div
          className={cn(
            "flex-1 min-h-0 min-w-0 transition-all duration-200 bg-background/50",
            hideTableOnMobile ? "hidden md:block" : "block",
          )}
        >
          <div
            ref={tableScrollRef}
            className="h-full min-h-0 w-full relative z-0"
          >
            <DynamicTable
              className="h-full border-none [&_.table-header]:border-b-border/40"
              rows={data}
              columns={dynamicColumns}
              getRowId={(row, index) => resolveRowId(row, index, primaryKey)}
              loading={tableLoading}
              loadingText={tableConfig?.loadingText}
              emptyState={tableConfig?.emptyState ?? "Aucun resultat."}
              state={dynamicState}
              onStateChange={handleStateChange}
              onOrderByChange={handleOrderByChange}
              onRowSelectionChange={handleRowSelectionChange}
              onPaginationChange={handlePaginationChange}
              expand={expand}
              sortMode="server"
              paginationMode="server"
              features={features}
              layout={{
                containerClassName:
                  "group/frame relative flex h-full flex-col overflow-hidden bg-transparent transition-all duration-500",
                actions: {
                  headerLabel: tableConfig?.actionsLabel ?? "",
                  sticky: true,
                  size: 140,
                  renderCell: ({ row }) => (
                    <RowActions
                      row={row}
                      data={data}
                      refetch={refetch}
                      permissions={
                        row.rowPermissions as RowMutationPermissions | undefined
                      }
                      columnActions={columnActions}
                      update={update}
                      detail={detail}
                    />
                  ),
                },
              }}
              totalRows={pagination.totalKnown ? pagination.total : undefined}
              pageCount={
                pagination.totalKnown ? pagination.numPages : undefined
              }
              hasNextPage={pagination.hasNextPage}
              hasPreviousPage={pagination.hasPreviousPage}
              onLoadMore={() => {
                if (
                  !isInfiniteMode ||
                  tableLoading ||
                  !pagination.hasNextPage
                ) {
                  return;
                }
                setPage(pagination.page + 1);
              }}
            />
          </div>
        </div>

        {!isInfiniteMode && (
          <div className="flex-none border-t border-border/40 bg-card backdrop-blur-md z-10 shrink-0">
            <TablePagination
              labels={tableConfig?.paginationLabels}
              enableSelection={resolvedEnableSelection}
            />
          </div>
        )}

        {dataError && <DataErrorDisplay error={dataError} />}
        {sectionController.metadata && sectionVisibility.dialogs && (
          <DialogsSlot controller={sectionController} />
        )}
      </div>
    </TooltipProvider>
  );
}

/**
 * Dynamic-model table built on the same metadata/filter contract as ModelTableV2.
 */
export const DynamicModelTable = forwardRef<
  DynamicModelTableHandle,
  DynamicModelTableProps
>(function DynamicModelTable(
  {
    app,
    model,
    filterPanel,
    create,
    update,
    detail,
    baseTable,
    devtools,
    initVariables,
  }: DynamicModelTableProps,
  ref,
) {
  const tableInstanceKey = `${app}:${model}`;
  const initialTableState = useMemo(
    () => resolveInitialTableState(initVariables),
    [initVariables],
  );
  const resolvedFilterPanel: ModelTableFilterPanelProps = {
    ...(filterPanel ?? {}),
    widthClassName: "!w-full lg:!w-1/2 sm:!max-w-none",
  };
  const devtoolsEnabled = resolveDevtoolsEnabled(devtools);
  const refetchRef = useRef<BaseModelTableRefetch | undefined>(undefined);
  const snapshotRef = useRef<DynamicModelTableSnapshot>({
    data: [],
    selectedRows: [],
    rowSelection: {},
    loading: false,
    metadataLoading: false,
    dataError: null,
    metadataError: null,
    metadata: null,
    pagination: null,
  });

  /**
   * Stores the latest refetch function provided by the table content.
   */
  const handleRefetchResolved = useCallback(
    (nextRefetch?: BaseModelTableRefetch) => {
      refetchRef.current = nextRefetch;
    },
    [],
  );
  /**
   * Stores the latest runtime snapshot provided by the table content.
   */
  const handleSnapshotResolved = useCallback(
    (nextSnapshot: DynamicModelTableSnapshot) => {
      snapshotRef.current = nextSnapshot;
    },
    [],
  );

  useImperativeHandle(
    ref,
    () => ({
      refetch: (variables?: Record<string, unknown>) => {
        if (!refetchRef.current) {
          return Promise.resolve(undefined);
        }
        return refetchRef.current(variables);
      },
      getSnapshot: () => snapshotRef.current,
      get data() {
        return snapshotRef.current.data;
      },
      get selectedRows() {
        return snapshotRef.current.selectedRows;
      },
      get rowSelection() {
        return snapshotRef.current.rowSelection;
      },
      get loading() {
        return snapshotRef.current.loading;
      },
      get metadataLoading() {
        return snapshotRef.current.metadataLoading;
      },
      get dataError() {
        return snapshotRef.current.dataError;
      },
      get metadataError() {
        return snapshotRef.current.metadataError;
      },
      get metadata() {
        return snapshotRef.current.metadata;
      },
      get pagination() {
        return snapshotRef.current.pagination;
      },
    }),
    [],
  );

  return (
    <div
      data-slot="model-table"
      className={
        baseTable?.className
          ? `h-full w-full ${baseTable.className}`
          : "h-full w-full"
      }
    >
      <MetadataProvider key={tableInstanceKey} app={app} model={model}>
        <TableProvider
          initialState={{
            density: baseTable?.view?.defaultDensity ?? "compact",
            wrapCells: baseTable?.view?.defaultWrapCells ?? false,
            pagination: {
              page: initialTableState.page,
              perPage: initialTableState.perPage,
              total: 0,
              numPages: 0,
              totalKnown: true,
              hasNextPage: false,
              hasPreviousPage: false,
            },
            advancedFilters: initialTableState.advancedFilters,
            filterVariables: initialTableState.filterVariables,
          }}
        >
          <DynamicBaseTableContent
            persistenceKey={baseTable?.persistenceKey}
            filterPanel={resolvedFilterPanel}
            create={create}
            update={update}
            detail={detail}
            tableConfig={baseTable?.tableConfig}
            view={baseTable?.view}
            performance={baseTable?.performance}
            quickSearch={baseTable?.quickSearch ?? true}
            topActions={baseTable?.topActions}
            content={baseTable?.content}
            hideTableOnMobile={baseTable?.hideTableOnMobile ?? true}
            fields={baseTable?.fields}
            relations={baseTable?.relations}
            relationStats={baseTable?.relationStats}
            queryManager={baseTable?.queryManager}
            columnOrdering={baseTable?.columnOrdering}
            skipCount={baseTable?.skipCount ?? false}
            disableSorting={baseTable?.disableSorting}
            enableSelection={baseTable?.enableSelection}
            expand={baseTable?.expand}
            columnActions={baseTable?.columnActions}
            devtoolsEnabled={devtoolsEnabled}
            onRefetchResolved={handleRefetchResolved}
            onSnapshotResolved={handleSnapshotResolved}
          />
        </TableProvider>
      </MetadataProvider>
    </div>
  );
});

DynamicModelTable.displayName = "DynamicModelTable";

function TableDevtoolsPanel({ timings }: { timings: TableDevtoolsTimings }) {
  return (
    <div className="pointer-events-none absolute right-3 top-3 z-20 border border-amber-300/60 bg-amber-50/95 px-3 py-2 text-[11px] leading-5 text-amber-900 shadow-sm backdrop-blur-sm dark:border-amber-700/50 dark:bg-amber-950/70 dark:text-amber-100">
      <div className="font-semibold uppercase tracking-wide">Devtools</div>
      <div>Metadata fetch: {formatTimingMs(timings.metadataFetchMs)}</div>
      <div>Data fetch: {formatTimingMs(timings.dataFetchMs)}</div>
      <div>Table build: {formatTimingMs(timings.tableBuildMs)}</div>
    </div>
  );
}

/**
 * Skeleton displayed while metadata is loading.
 * Premium shimmer effect with staggered row animation.
 */
function LoadingSkeleton() {
  return (
    <div
      className="flex h-105 w-full flex-col gap-5 p-4 animate-in fade-in duration-500"
      role="status"
    >
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="size-12 animate-pulse bg-muted/40" />
          <div className="flex flex-col gap-2">
            <div className="h-3 w-20 animate-pulse bg-muted/30" />
            <div className="h-6 w-48 animate-pulse bg-muted/40" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 animate-pulse bg-muted/30" />
          <div className="h-9 w-20 animate-pulse bg-muted/30" />
        </div>
      </div>
      {/* Toolbar skeleton */}
      <div className="h-12 w-full animate-pulse bg-muted/20 border border-border/20" />
      {/* Table skeleton */}
      <div className="flex-1 overflow-hidden border border-border/20 bg-card/30 backdrop-blur-sm">
        <div className="h-10 w-full bg-muted/30" />
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-b border-border/10 px-4 py-3"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="size-4 animate-pulse bg-muted/30" />
            <div className="h-3.5 flex-2 animate-pulse bg-muted/25" />
            <div className="h-3.5 flex-1 animate-pulse bg-muted/20" />
            <div className="h-3.5 w-20 animate-pulse bg-muted/20" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Error state displayed when metadata loading fails.
 * Premium card with gradient accent strip and centered icon.
 */
function ErrorState({ error }: { error: Error }) {
  return (
    <div className="flex h-100 items-center justify-center p-8">
      <div className="max-w-md w-full overflow-hidden border border-rose-200/60 dark:border-rose-800/30 bg-background/95 shadow-xl backdrop-blur-xl animate-in zoom-in-95 duration-300">
        {/* Accent strip */}
        <div className="h-1.5 w-full bg-linear-to-r from-rose-400 via-rose-500 to-rose-600" />
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex size-14 items-center justify-center bg-rose-500/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-7 text-rose-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">
              Erreur de m├â┬®tadonn├â┬®es
            </h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {localizeTableErrorMessage(error)}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 bg-rose-500 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-rose-500/20 transition-all hover:bg-rose-600 hover:scale-[1.02] active:scale-95"
          >
            R├â┬®essayer
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Data-level error display shown below the table.
 * Premium inline alert with icon and subtle background.
 */
function DataErrorDisplay({ error }: { error: Error }) {
  return (
    <div className="flex-none flex items-center gap-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-800/30 px-4 py-3 text-xs font-semibold text-rose-600 dark:text-rose-400 mt-3 animate-in slide-in-from-top-1 duration-300">
      <div className="flex size-6 shrink-0 items-center justify-center bg-rose-500/10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="size-3.5 text-rose-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      </div>
      <span>Erreur de donn├â┬®es : {localizeTableErrorMessage(error)}</span>
    </div>
  );
}
