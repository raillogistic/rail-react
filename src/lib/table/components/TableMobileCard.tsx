import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/lib/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/components/ui/card";
import { Skeleton } from "@/lib/components/ui/skeleton";
import { useTable } from "../context/TableContext";
import { useMetadata } from "../context/MetadataContext";
import {
  formatCellValue,
  resolveColumnVisibility,
  resolveFieldValue,
  resolveGroupingKey,
  resolveGroupingLabel,
  toCamelCase,
  toGraphqlFieldName,
  toSnakeCase,
} from "../utils";
import type {
  BaseModelTableColumnActionsInput,
  BaseModelTableRefetch,
  RowMutationPermissions,
} from "../types";
import { RowActions } from "./row/RowActions";

const MOBILE_BATCH_SIZE = 24;

export function TableMobileCard({
  emptyState,
  refetch,
  columnActions,
}: {
  emptyState?: string;
  refetch?: BaseModelTableRefetch;
  columnActions?: BaseModelTableColumnActionsInput;
}) {
  const { metadata } = useMetadata();
  const {
    data,
    loading,
    columnOrder,
    columnVisibility,
    density,
    wrapCells,
    groupingField,
    groupCollapsed,
    setGroupCollapsed,
  } = useTable();
  const [visibleCount, setVisibleCount] = useState(MOBILE_BATCH_SIZE);

  useEffect(() => {
    setVisibleCount(MOBILE_BATCH_SIZE);
  }, [data.length]);

  if (!metadata) return null;

  if (loading && data.length === 0) {
    return (
      <div className="space-y-3 md:hidden">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-[180px]" />
              <Skeleton className="h-3 w-[120px]" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border p-4 text-center text-muted-foreground md:hidden">
        {emptyState ?? "Aucun resultat."}
      </div>
    );
  }

  const byName = useMemo(
    () => new Map(metadata.fields.map((field) => [field.name, field])),
    [metadata.fields],
  );
  const byFieldName = useMemo(
    () =>
      new Map(metadata.fields.map((field) => [field.name || field.fieldName, field])),
    [metadata.fields],
  );

  const orderedColumns = useMemo(
    () =>
      columnOrder
        .map((columnId) => byName.get(columnId) || byFieldName.get(columnId))
        .filter((field): field is (typeof metadata.fields)[number] => !!field),
    [byFieldName, byName, columnOrder, metadata.fields],
  );

  const mergedColumns = useMemo(() => {
    const seenColumns = new Set<string>();
    return [...orderedColumns, ...metadata.fields].filter((field) => {
      if (seenColumns.has(field.name)) return false;
      seenColumns.add(field.name);
      return true;
    });
  }, [metadata.fields, orderedColumns]);

  const visibleColumns = useMemo(
    () =>
      mergedColumns.filter((field) => {
        if (field.visibility === "hidden") return false;
        return resolveColumnVisibility(columnVisibility, [
          field.name,
          field.fieldName,
        ]);
      }),
    [columnVisibility, mergedColumns],
  );

  const showIdDescription =
    visibleColumns.length === 0 ||
    visibleColumns.some((field) => {
      const id = field.name || field.fieldName;
      return id === "id";
    });

  const groupingFieldMeta = useMemo(() => {
    if (!groupingField) return undefined;
    const root = groupingField.replace(/__/g, ".").split(".")[0];
    const candidates = [
      groupingField,
      toGraphqlFieldName(groupingField),
      toCamelCase(groupingField),
      toSnakeCase(groupingField),
      root,
      toGraphqlFieldName(root),
      toCamelCase(root),
      toSnakeCase(root),
    ];

    for (const candidate of candidates) {
      if (!candidate) continue;
      const field = byName.get(candidate) || byFieldName.get(candidate);
      if (field) return field;
    }

    return undefined;
  }, [byFieldName, byName, groupingField]);

  const groupingFieldLabel = useMemo(() => {
    if (!groupingField) return undefined;
    if (groupingFieldMeta?.verboseName) return groupingFieldMeta.verboseName;
    const root = groupingField.replace(/__/g, ".").split(".")[0];
    return root || groupingField;
  }, [groupingField, groupingFieldMeta?.verboseName]);

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
        label: resolveGroupingLabel(row, groupingField, {
          fieldLabel: groupingFieldLabel,
          isBoolean: groupingFieldMeta?.isBoolean,
        }),
        rows: [row],
      });
    });

    return Array.from(groups.values());
  }, [data, groupingField, groupingFieldLabel, groupingFieldMeta?.isBoolean]);

  const displayedRows = data.slice(0, visibleCount);
  const displayedGroups = useMemo(() => {
    if (!groupedData) return null;

    let remaining = visibleCount;
    const groups: Array<{
      key: string;
      label: string;
      rows: Record<string, unknown>[];
    }> = [];

    groupedData.forEach((group) => {
      if (remaining <= 0) return;
      const rows = group.rows.slice(0, remaining);
      remaining -= rows.length;
      if (rows.length > 0) {
        groups.push({ ...group, rows });
      }
    });

    return groups;
  }, [groupedData, visibleCount]);

  const hasMore = visibleCount < data.length;
  const titleField = visibleColumns[0];
  const otherFields = visibleColumns.slice(1);
  const rowSpacingClass =
    density === "compact"
      ? "gap-1 py-1"
      : density === "spacious"
        ? "gap-3 py-2"
        : "gap-2 py-1.5";
  const valueClass = wrapCells
    ? "text-right break-words"
    : "max-w-[200px] truncate text-right";

  const toggleGroup = (groupKey: string) => {
    setGroupCollapsed({
      ...groupCollapsed,
      [groupKey]: !groupCollapsed[groupKey],
    });
  };

  const renderCardRow = (
    row: Record<string, unknown>,
    index: number,
    keyPrefix?: string,
  ) => {
    const rowId = String(row.id);
    const rowPermissions = row.rowPermissions as RowMutationPermissions | undefined;

    return (
      <Card key={`${keyPrefix ?? "row"}:${rowId || index}`} className="overflow-hidden border">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className={wrapCells ? "text-base" : "truncate text-base"}>
                {titleField
                  ? formatCellValue(resolveFieldValue(row, titleField), titleField)
                  : metadata?.verboseName || "Element"}
              </CardTitle>
              {showIdDescription ? (
                <CardDescription className="text-xs font-mono">ID: {rowId}</CardDescription>
              ) : null}
            </div>
            <div className="shrink-0">
              <RowActions
                row={row}
                data={data}
                refetch={refetch}
                permissions={rowPermissions}
                columnActions={columnActions}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className={`grid text-sm ${rowSpacingClass}`}>
          {otherFields.map((field) => (
            <div
              key={field.name}
              className="flex items-start justify-between gap-3 border-b pb-1 last:border-0"
            >
              <span className="font-medium text-muted-foreground">
                {field.verboseName}:
              </span>
              <span className={valueClass}>
                {formatCellValue(resolveFieldValue(row, field), field)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-3 md:hidden">
      {displayedGroups
        ? displayedGroups.map((group) => {
            const collapsed = !!groupCollapsed[group.key];
            return (
              <div key={`group:${group.key}`} className="space-y-2">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  className="flex w-full items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-left"
                >
                  <div className="flex items-center gap-2">
                    {collapsed ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-semibold text-foreground/90">
                      {group.label}
                    </span>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {group.rows.length}
                  </span>
                </button>
                {!collapsed
                  ? group.rows.map((row, index) => renderCardRow(row, index, group.key))
                  : null}
              </div>
            );
          })
        : displayedRows.map((row, index) => renderCardRow(row, index))}

      {hasMore ? (
        <Button
          variant="outline"
          className="w-full"
          onClick={() =>
            setVisibleCount((current) =>
              Math.min(current + MOBILE_BATCH_SIZE, data.length),
            )
          }
        >
          Afficher plus ({data.length - visibleCount} restants)
        </Button>
      ) : null}
    </div>
  );
}
