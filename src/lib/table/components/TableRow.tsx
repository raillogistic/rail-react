import React, { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { TableRow as ShadcnTableRow, TableCell } from "./TableFrame";
import { useTable } from "../context/TableContext";
import { useMetadata } from "../context/MetadataContext";
import {
  getSyntheticRelationCountSource,
  resolveGroupingKey,
  resolveGroupingLabel,
  toCamelCase,
  toGraphqlFieldName,
  toSnakeCase,
} from "../utils";
import type {
  BaseModelTableColumnActionsInput,
  BaseModelTableColumnDef,
  BaseModelTableRelationStatsConfig,
  BaseModelTableRelationStatsOverride,
  BaseModelTableRefetch,
  FieldSchema,
  RelationshipSchema,
} from "../types";
import { DataRow, GroupedRow } from "./row";
import { normalizeRelationKey, toLabel } from "./row/utils/statsHelpers";
import type { StatsRelationMeta } from "./row/RelationStatsHover";

export function TableRows({
  loadingText,
  emptyState,
  columns,
  enableSelection,
  refetch,
  columnActions,
  relationStats,
  performance,
  scrollContainerRef,
  infiniteMode,
}: {
  loadingText?: string;
  emptyState?: string;
  columns?: BaseModelTableColumnDef[];
  enableSelection?: boolean;
  refetch?: BaseModelTableRefetch;
  columnActions?: BaseModelTableColumnActionsInput;
  relationStats?: BaseModelTableRelationStatsConfig;
  performance?: {
    enableVirtualization?: boolean;
    virtualizeThreshold?: number;
    overscan?: number;
  };
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  infiniteMode?: boolean;
}) {
  const { metadata } = useMetadata();
  const {
    data,
    loading,
    columnOrder,
    columnVisibility,
    rowSelection,
    setRowSelection,
    groupingField,
    groupCollapsed,
    setGroupCollapsed,
    density,
    wrapCells,
  } = useTable();
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const fieldLookup = useMemo(() => {
    if (!metadata) return new Map<string, FieldSchema>();
    const lookup = new Map<string, FieldSchema>();
    metadata.fields.forEach((field) => {
      lookup.set(field.name, field);
      if (field.fieldName) lookup.set(field.fieldName, field);
    });
    return lookup;
  }, [metadata]);

  const relationLookup = useMemo(() => {
    const lookup = new Map<string, RelationshipSchema>();
    if (!metadata?.relationships) return lookup;
    metadata.relationships.forEach((relation) => {
      if (relation.name) lookup.set(relation.name, relation);
      if (relation.fieldName) lookup.set(relation.fieldName, relation);
    });
    return lookup;
  }, [metadata?.relationships]);

  const resolveValue = (row: Record<string, unknown>, accessor: string) =>
    accessor.split(".").reduce<unknown>((acc, key) => {
      if (!acc || typeof acc !== "object") return undefined;
      const record = acc as Record<string, unknown>;
      if (Object.prototype.hasOwnProperty.call(record, key)) return record[key];
      const camelKey = key.replace(/_([a-z])/g, (_, letter: string) =>
        letter.toUpperCase(),
      );
      if (Object.prototype.hasOwnProperty.call(record, camelKey)) {
        return record[camelKey];
      }
      const snakeKey = key
        .replace(/([A-Z])/g, "_$1")
        .toLowerCase()
        .replace(/^_/, "");
      if (Object.prototype.hasOwnProperty.call(record, snakeKey)) {
        return record[snakeKey];
      }
      return undefined;
    }, row);

  const formatFallbackValue = (value: unknown) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }
    if (typeof value === "boolean") return value ? "Oui" : "Non";
    if (value instanceof Date) return value.toISOString();
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  const whereType =
    metadata?.filterConfig?.inputTypeName || `${metadata?.model || "Model"}WhereInput`;
  const primaryKey = metadata?.primaryKey || "id";
  const statsEnabled = relationStats?.enabled !== false;

  const includeSet = useMemo(
    () =>
      new Set((relationStats?.include ?? []).map((name) => normalizeRelationKey(name))),
    [relationStats?.include],
  );
  const excludeSet = useMemo(
    () =>
      new Set((relationStats?.exclude ?? []).map((name) => normalizeRelationKey(name))),
    [relationStats?.exclude],
  );

  const resolveStatsRelation = React.useCallback(
    (accessor: string, fieldMeta?: FieldSchema): StatsRelationMeta | null => {
      if (!statsEnabled || !metadata) return null;
      const root = accessor.split(".")[0];
      if (!root || root.endsWith("Stats")) return null;
      const normalizedRoot = normalizeRelationKey(root);

      const candidates = new Set<string>();
      const relationFromSynthetic = fieldMeta
        ? getSyntheticRelationCountSource(fieldMeta)
        : undefined;
      if (relationFromSynthetic) candidates.add(relationFromSynthetic);
      if (fieldMeta?.isRelation) {
        if (fieldMeta.name) candidates.add(fieldMeta.name);
        if (fieldMeta.fieldName) candidates.add(fieldMeta.fieldName);
      }
      candidates.add(root);
      if (/count$/i.test(root)) {
        const stripped = root.replace(/count$/i, "");
        if (stripped) candidates.add(stripped);
      }

      const normalizedCandidates = new Set<string>();
      candidates.forEach((candidate) => {
        normalizedCandidates.add(candidate);
        normalizedCandidates.add(
          candidate.replace(/_([a-z])/g, (_, letter: string) =>
            letter.toUpperCase(),
          ),
        );
        normalizedCandidates.add(toSnakeCase(candidate));
      });

      let relation: RelationshipSchema | undefined;
      normalizedCandidates.forEach((candidate) => {
        if (relation) return;
        relation = relationLookup.get(candidate);
      });
      if (!relation) return null;

      const normalizedRelationName = normalizeRelationKey(
        relation.name || relation.fieldName || root,
      );
      if (includeSet.size > 0) {
        const includeMatch =
          includeSet.has(normalizedRelationName) || includeSet.has(normalizedRoot);
        if (!includeMatch) return null;
      }
      if (
        excludeSet.has(normalizedRelationName) ||
        excludeSet.has(normalizedRoot)
      ) {
        return null;
      }

      const relationType = (relation.relationType || "").toUpperCase();
      const isReverseOrManyToMany =
        relation.isReverse ||
        relationType.includes("MANY_TO_MANY") ||
        relationType.includes("MANYTOMANY") ||
        relationType.includes("REVERSE_FK");

      if (!relation.isToMany || !isReverseOrManyToMany) return null;

      const relationName = toGraphqlFieldName(
        relation.name || relation.fieldName || "",
      );
      if (!relationName) return null;
      const relationLabel =
        relation.verboseName ||
        fieldMeta?.verboseName ||
        toLabel(relation.name || relation.fieldName || relationName);

      return {
        relationName,
        relationLabel,
        relatedApp: relation.relatedApp,
        relatedModel: relation.relatedModel,
      };
    },
    [excludeSet, includeSet, metadata, relationLookup, statsEnabled],
  );

  const resolveStatsOverride = React.useCallback(
    (
      accessor: string,
      relationName: string,
    ): BaseModelTableRelationStatsOverride | undefined => {
      const overrides = relationStats?.overrides;
      if (!overrides) return undefined;

      const root = accessor.split(".")[0] || accessor;
      const keyCandidates = [
        accessor,
        root,
        toCamelCase(root),
        toSnakeCase(root),
        relationName,
        toCamelCase(relationName),
        toSnakeCase(relationName),
      ];

      for (const key of keyCandidates) {
        if (Object.prototype.hasOwnProperty.call(overrides, key)) {
          return overrides[key];
        }
      }

      return undefined;
    },
    [relationStats?.overrides],
  );

  const visibleColumns = useMemo(() => {
    if (columns && columns.length > 0) {
      const byId = new Map(columns.map((column) => [column.id, column]));
      const orderedIds =
        columnOrder.length > 0 ? columnOrder : columns.map((c) => c.id);
      return orderedIds
        .map((id) => byId.get(id))
        .filter((column): column is BaseModelTableColumnDef => !!column)
        .filter((column) => columnVisibility[column.id] ?? true);
    }

    if (!metadata) return [];
    return columnOrder
      .map((colId) => metadata.fields.find((f) => f.name === colId))
      .filter(
        (field): field is FieldSchema => !!field && columnVisibility[field.name],
      );
  }, [columnOrder, columnVisibility, columns, metadata]);

  const groupedData = useMemo(() => {
    if (!groupingField) return null;

    const groups = new Map<
      string,
      {
        key: string;
        label: string;
        rows: Record<string, unknown>[];
      }
    >();

    data.forEach((row) => {
      const key = resolveGroupingKey(row, groupingField);
      const existing = groups.get(key);
      if (existing) {
        existing.rows.push(row);
        return;
      }
      groups.set(key, {
        key,
        label: resolveGroupingLabel(row, groupingField),
        rows: [row],
      });
    });

    return Array.from(groups.values());
  }, [data, groupingField]);

  const handleRowSelect = (rowId: string, checked: boolean) => {
    const nextSelection = { ...rowSelection };
    if (checked) {
      nextSelection[rowId] = true;
    } else {
      delete nextSelection[rowId];
    }
    setRowSelection(nextSelection);
  };

  const fixedColumnCount = (enableSelection ? 1 : 0) + 1;
  const rowHeight = density === "compact" ? 32 : density === "spacious" ? 48 : 40;
  const cellPadding =
    density === "compact"
      ? "py-0 px-2.5"
      : density === "spacious"
        ? "py-0 px-4"
        : "py-0 px-3";
  const cellTextSize =
    density === "compact" ? "text-xs" : density === "spacious" ? "text-sm" : "text-sm";
  const cellTextClass = wrapCells
    ? "whitespace-normal break-words leading-snug py-1"
    : "truncate";

  React.useEffect(() => {
    const container = scrollContainerRef?.current;
    if (!container) return;

    const updateMetrics = () => {
      setViewportHeight(container.clientHeight);
      setScrollTop(container.scrollTop);
    };

    let rafId: number | null = null;
    const onScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        setScrollTop(container.scrollTop);
      });
    };

    updateMetrics();
    container.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateMetrics);

    return () => {
      container.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateMetrics);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [scrollContainerRef]);

  if (loading && data.length === 0) {
    return (
      <ShadcnTableRow>
        <TableCell colSpan={visibleColumns.length + fixedColumnCount} className="h-48">
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
              <Loader2 className="relative h-6 w-6 animate-spin text-primary/60" />
            </div>
            <span className="text-sm font-medium">{loadingText ?? "Chargement..."}</span>
          </div>
        </TableCell>
      </ShadcnTableRow>
    );
  }

  if (data.length === 0) {
    return (
      <ShadcnTableRow>
        <TableCell colSpan={visibleColumns.length + fixedColumnCount} className="h-48">
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-2">
              <svg className="h-6 w-6 text-muted-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <span className="text-sm font-medium">{emptyState ?? "Aucun résultat."}</span>
          </div>
        </TableCell>
      </ShadcnTableRow>
    );
  }

  const toggleGroup = (groupKey: string) => {
    const nextCollapsed = { ...groupCollapsed };
    const current = nextCollapsed[groupKey] ?? false;
    nextCollapsed[groupKey] = !current;
    setGroupCollapsed(nextCollapsed);
  };

  if (groupedData && groupedData.length > 0) {
    let renderedIndex = 0;
    return (
      <>
        {groupedData.map((group) => {
          const collapsed = groupCollapsed[group.key] ?? false;

          return (
            <React.Fragment key={`group-${group.key}`}>
              <GroupedRow
                group={group}
                collapsed={collapsed}
                colSpan={visibleColumns.length + fixedColumnCount}
                onToggle={toggleGroup}
              />
              {!collapsed
                ? group.rows.map((row) => (
                    <DataRow
                      key={String(row.id)}
                      row={row}
                      rowIndex={renderedIndex++}
                      data={data}
                      visibleColumns={visibleColumns}
                      enableSelection={enableSelection}
                      rowSelection={rowSelection}
                      handleRowSelect={handleRowSelect}
                      refetch={refetch}
                      columnActions={columnActions}
                      density={density}
                      cellPadding={cellPadding}
                      cellTextSize={cellTextSize}
                      cellTextClass={cellTextClass}
                      fieldLookup={fieldLookup}
                      resolveValue={resolveValue}
                      formatFallbackValue={formatFallbackValue}
                      resolveStatsRelation={resolveStatsRelation}
                      resolveStatsOverride={resolveStatsOverride}
                      primaryKey={primaryKey}
                      modelName={metadata?.model || "Model"}
                      whereType={whereType}
                    />
                  ))
                : null}
            </React.Fragment>
          );
        })}
        {infiniteMode && loading ? (
          <ShadcnTableRow>
            <TableCell colSpan={visibleColumns.length + fixedColumnCount} className="py-4 text-center">
              <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Chargement...
              </span>
            </TableCell>
          </ShadcnTableRow>
        ) : null}
      </>
    );
  }

  const enableVirtualization =
    (performance?.enableVirtualization ?? true) &&
    !wrapCells &&
    !groupingField &&
    data.length >= (performance?.virtualizeThreshold ?? 80) &&
    viewportHeight > 0;
  const overscan = Math.max(2, performance?.overscan ?? 8);
  const startIndex = enableVirtualization
    ? Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
    : 0;
  const visibleCount = enableVirtualization
    ? Math.ceil(viewportHeight / rowHeight) + overscan * 2
    : data.length;
  const endIndex = enableVirtualization
    ? Math.min(data.length, startIndex + visibleCount)
    : data.length;
  const topSpacerHeight = enableVirtualization ? startIndex * rowHeight : 0;
  const bottomSpacerHeight = enableVirtualization
    ? Math.max(0, (data.length - endIndex) * rowHeight)
    : 0;
  const visibleRows = data.slice(startIndex, endIndex);

  return (
    <>
      {enableVirtualization && topSpacerHeight > 0 ? (
        <ShadcnTableRow aria-hidden="true">
          <TableCell
            colSpan={visibleColumns.length + fixedColumnCount}
            style={{ height: `${topSpacerHeight}px` }}
            className="border-0 p-0"
          />
        </ShadcnTableRow>
      ) : null}
      {(enableVirtualization ? visibleRows : data).map((row, index) => (
        <DataRow
          key={String(row.id)}
          row={row}
          rowIndex={enableVirtualization ? startIndex + index : index}
          data={data}
          visibleColumns={visibleColumns}
          enableSelection={enableSelection}
          rowSelection={rowSelection}
          handleRowSelect={handleRowSelect}
          refetch={refetch}
          columnActions={columnActions}
          density={density}
          cellPadding={cellPadding}
          cellTextSize={cellTextSize}
          cellTextClass={cellTextClass}
          fieldLookup={fieldLookup}
          resolveValue={resolveValue}
          formatFallbackValue={formatFallbackValue}
          resolveStatsRelation={resolveStatsRelation}
          resolveStatsOverride={resolveStatsOverride}
          primaryKey={primaryKey}
          modelName={metadata?.model || "Model"}
          whereType={whereType}
        />
      ))}
      {enableVirtualization && bottomSpacerHeight > 0 ? (
        <ShadcnTableRow aria-hidden="true">
          <TableCell
            colSpan={visibleColumns.length + fixedColumnCount}
            style={{ height: `${bottomSpacerHeight}px` }}
            className="border-0 p-0"
          />
        </ShadcnTableRow>
      ) : null}
      {infiniteMode && loading ? (
        <ShadcnTableRow>
          <TableCell colSpan={visibleColumns.length + fixedColumnCount} className="py-4 text-center">
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Chargement...
            </span>
          </TableCell>
        </ShadcnTableRow>
      ) : null}
    </>
  );
}
