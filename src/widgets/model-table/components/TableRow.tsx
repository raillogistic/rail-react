import React, { useMemo, useCallback } from "react";
import { Loader2, Database } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { TableRow as ShadcnTableRow, TableCell } from "./TableFrame";
import { useTable } from "../context/TableContext";
import { useMetadata } from "../context/MetadataContext";
import {
  getSyntheticRelationCountSource,
  resolveColumnVisibility,
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
import { buildAccessorPath, resolveValueOptimized } from "../utils/valueResolution";
import { flattenGroupedData, type FlattenedRow } from "../utils/flattenData";
import { getColumnWidthStyle } from "../utils/columnSizing";

export function TableRows({
  loadingText,
  emptyState,
  columns,
  enableSelection,
  refetch,
  columnActions,
  relationStats,
  queryManager,
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
  queryManager?: string;
  performance?: {
    enableVirtualization?: boolean;
    virtualizeThreshold?: number;
    overscan?: number;
    estimateRowHeight?: number;
  };
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  infiniteMode?: boolean;
}) {
  const { metadata } = useMetadata();
  const {
    data,
    loading,
    columnOrder,
    columnVisibility,
    columnWidths,
    rowSelection,
    setRowSelection,
    groupingField,
    groupCollapsed,
    setGroupCollapsed,
    density,
    wrapCells,
  } = useTable();

  // 1. Metadata Lookups
  const fieldLookup = useMemo(() => {
    const lookup = new Map<string, FieldSchema>();
    if (!metadata) return lookup;
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
  }, [metadata]);

  // 2. Optimized Value Resolution
  const accessorPaths = useMemo(() => {
    const paths = new Map<string, string[]>();
    if (columns) {
      columns.forEach((col) => {
        if ("accessor" in col) {
          paths.set(col.accessor, buildAccessorPath(col.accessor));
        }
      });
    }
    return paths;
  }, [columns]);

  const resolveValue = useCallback((row: Record<string, unknown>, accessor: string) => {
    const path = accessorPaths.get(accessor) ?? buildAccessorPath(accessor);
    return resolveValueOptimized(row, path);
  }, [accessorPaths]);

  const resolveColumnStyle = useCallback(
    (columnId: string) => getColumnWidthStyle(columnWidths, columnId),
    [columnWidths],
  );

  // 3. Columns Visibility
  const visibleColumns = useMemo(() => {
    if (columns && columns.length > 0) {
      const byId = new Map(columns.map((column) => [column.id, column]));
      const orderedIds = columnOrder.length > 0 ? columnOrder : columns.map((c) => c.id);
      return orderedIds
        .map((id) => byId.get(id))
        .filter((column): column is BaseModelTableColumnDef => !!column)
        .filter((column) =>
          resolveColumnVisibility(columnVisibility, [
            column.id,
            "accessor" in column ? column.accessor : undefined,
          ]),
        );
    }
    return [];
  }, [columnOrder, columnVisibility, columns]);

  // 4. Data Grouping
  const groupingFieldLabel = useMemo(() => {
    if (!groupingField) return undefined;
    const root = groupingField.split(".")[0];
    const fieldMeta = fieldLookup.get(groupingField) || fieldLookup.get(root);
    return fieldMeta?.verboseName || toLabel(root || groupingField);
  }, [groupingField, fieldLookup]);

  const groupedData = useMemo(() => {
    if (!groupingField) return null;
    const groups = new Map<string, { key: string; label: string; rows: any[] }>();
    
    data.forEach((row) => {
      const key = resolveGroupingKey(row, groupingField);
      const existing = groups.get(key);
      if (existing) {
        existing.rows.push(row);
      } else {
        groups.set(key, {
          key,
          label: resolveGroupingLabel(row, groupingField, {
            fieldLabel: groupingFieldLabel,
            isBoolean: fieldLookup.get(groupingField)?.isBoolean,
          }),
          rows: [row],
        });
      }
    });
    return Array.from(groups.values());
  }, [data, groupingField, groupingFieldLabel, fieldLookup]);

  // 5. Flattening & Virtualization
  const flattenedRows = useMemo(() => {
    if (groupedData) {
      return flattenGroupedData(groupedData, groupCollapsed);
    }
    return data.map((row, idx) => ({ type: "data" as const, row, rowIndex: idx }));
  }, [data, groupedData, groupCollapsed]);

  const enableVirtualization = 
    (performance?.enableVirtualization ?? true) && 
    !wrapCells && 
    flattenedRows.length >= (performance?.virtualizeThreshold ?? 50);

  const rowVirtualizer = useVirtualizer({
    count: enableVirtualization ? flattenedRows.length : 0,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => {
      if (density === "compact") return 32;
      if (density === "spacious") return 48;
      return 40;
    },
    overscan: performance?.overscan ?? 10,
  });

  // 6. Handlers
  const handleRowSelect = (rowId: string, checked: boolean) => {
    const nextSelection = { ...rowSelection };
    if (checked) nextSelection[rowId] = true;
    else delete nextSelection[rowId];
    setRowSelection(nextSelection);
  };

  const toggleGroup = (groupKey: string) => {
    const nextCollapsed = { ...groupCollapsed };
    nextCollapsed[groupKey] = !nextCollapsed[groupKey];
    setGroupCollapsed(nextCollapsed);
  };

  // 7. Stats Resolution
  const resolveStatsRelation = useCallback(
    (accessor: string, fieldMeta?: FieldSchema) => {
      if (!relationStats?.enabled || !metadata) return null;

      const field = fieldMeta || fieldLookup.get(accessor);
      if (!field?.isRelation || !field.relationLookupField) return null;

      // Check include/exclude
      if (
        relationStats.include &&
        !relationStats.include.includes(accessor) &&
        !relationStats.include.includes(field.name)
      ) {
        return null;
      }
      if (
        relationStats.exclude &&
        (relationStats.exclude.includes(accessor) ||
          relationStats.exclude.includes(field.name))
      ) {
        return null;
      }

      const relation = relationLookup.get(field.relationLookupField);
      if (!relation || !relation.isToMany) return null;

      return {
        relationName: relation.fieldName || relation.name,
        relationLabel: relation.verboseName || toLabel(relation.name),
        relatedApp: relation.relatedApp,
        relatedModel: relation.relatedModel,
      } satisfies StatsRelationMeta;
    },
    [relationStats, metadata, fieldLookup, relationLookup],
  );

  const resolveStatsOverride = useCallback(
    (accessor: string, relationName: string) => {
      return (
        relationStats?.overrides?.[accessor] ||
        relationStats?.overrides?.[relationName]
      );
    },
    [relationStats],
  );

  // 8. Styling & Helpers
  const cellPadding = useMemo(() => {
    if (density === "compact") return "px-2 py-1";
    if (density === "spacious") return "px-4 py-3";
    return "px-3 py-2";
  }, [density]);

  const cellTextSize = useMemo(() => {
    if (density === "compact") return "text-[11px]";
    if (density === "spacious") return "text-sm";
    return "text-[13px]";
  }, [density]);

  const cellTextClass = useMemo(() => {
    return wrapCells ? "whitespace-normal break-words" : "truncate";
  }, [wrapCells]);

  const formatFallbackValue = useCallback((value: unknown) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }, []);

  // 9. Context Variables
  const fixedColumnCount = (enableSelection ? 1 : 0) + 1;
  const primaryKey = metadata?.primaryKey || "id";
  const whereType =
    metadata?.filterConfig?.inputTypeName ||
    `${metadata?.model || "Model"}WhereInput`;

  // 10. Render Logic
  if (loading && data.length === 0)
    return (
      <LoadingRow
        colSpan={visibleColumns.length + fixedColumnCount}
        text={loadingText}
      />
    );
  if (data.length === 0)
    return (
      <EmptyRow
        colSpan={visibleColumns.length + fixedColumnCount}
        text={emptyState}
      />
    );

  const renderFlattenedRow = (item: FlattenedRow) => {
    if (item.type === "group") {
      return (
        <GroupedRow
          key={`group-${item.groupKey}`}
          group={item}
          collapsed={groupCollapsed[item.groupKey]}
          colSpan={visibleColumns.length + fixedColumnCount}
          onToggle={toggleGroup}
        />
      );
    }

    return (
      <DataRow
        key={String(item.row[primaryKey])}
        row={item.row}
        rowIndex={item.rowIndex}
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
        queryManager={queryManager}
        resolveColumnStyle={resolveColumnStyle}
      />
    );
  };

  if (enableVirtualization) {
    const virtualRows = rowVirtualizer.getVirtualItems();
    const totalSize = rowVirtualizer.getTotalSize();
    const paddingTop = virtualRows.length > 0 ? virtualRows?.[0]?.start || 0 : 0;
    const paddingBottom =
      virtualRows.length > 0
        ? totalSize - (virtualRows?.[virtualRows.length - 1]?.end || 0)
        : 0;

    return (
      <>
        {paddingTop > 0 && (
          <ShadcnTableRow style={{ height: `${paddingTop}px`, border: 0 }}>
            <TableCell colSpan={visibleColumns.length + fixedColumnCount} className="p-0 border-0" />
          </ShadcnTableRow>
        )}
        {virtualRows.map((virtualRow) => (
          <React.Fragment key={virtualRow.key}>
            {renderFlattenedRow(flattenedRows[virtualRow.index])}
          </React.Fragment>
        ))}
        {paddingBottom > 0 && (
          <ShadcnTableRow style={{ height: `${paddingBottom}px`, border: 0 }}>
            <TableCell colSpan={visibleColumns.length + fixedColumnCount} className="p-0 border-0" />
          </ShadcnTableRow>
        )}
      </>
    );
  }

  return (
    <>
      {flattenedRows.map((item) => renderFlattenedRow(item))}
      {infiniteMode && loading && <InfiniteLoadingRow colSpan={visibleColumns.length + fixedColumnCount} />}
    </>
  );
}

// Sub-components
function LoadingRow({ colSpan, text }: { colSpan: number, text?: string }) {
  return (
    <ShadcnTableRow>
      <TableCell colSpan={colSpan} className="h-48 text-center">
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
          <span className="text-sm font-medium">{text ?? "Chargement..."}</span>
        </div>
      </TableCell>
    </ShadcnTableRow>
  );
}

function EmptyRow({ colSpan, text }: { colSpan: number, text?: string }) {
  return (
    <ShadcnTableRow>
      <TableCell colSpan={colSpan} className="h-48 text-center">
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
          <Database className="h-12 w-12 text-muted-foreground/40 mb-2" />
          <span className="text-sm font-medium">{text ?? "Aucun résultat."}</span>
        </div>
      </TableCell>
    </ShadcnTableRow>
  );
}

function InfiniteLoadingRow({ colSpan }: { colSpan: number }) {
  return (
    <ShadcnTableRow>
      <TableCell colSpan={colSpan} className="py-4 text-center">
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />Chargement...
        </span>
      </TableCell>
    </ShadcnTableRow>
  );
}
