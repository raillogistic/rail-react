import { useEffect, useState } from "react";
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
import { formatCellValue, resolveFieldValue } from "../utils";

const MOBILE_BATCH_SIZE = 24;

export function TableMobileCard({
  emptyState,
}: {
  emptyState?: string;
}) {
  const { metadata } = useMetadata();
  const { data, loading, columnOrder, columnVisibility, density, wrapCells } =
    useTable();
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

  const byName = new Map(metadata.fields.map((field) => [field.name, field]));
  const byFieldName = new Map(
    metadata.fields.map((field) => [field.fieldName || field.name, field]),
  );
  const orderedColumns = columnOrder
    .map((columnId) => byName.get(columnId) || byFieldName.get(columnId))
    .filter((field): field is (typeof metadata.fields)[number] => !!field);
  const seenColumns = new Set<string>();
  const mergedColumns = [...orderedColumns, ...metadata.fields].filter((field) => {
    if (seenColumns.has(field.name)) return false;
    seenColumns.add(field.name);
    return true;
  });
  const visibleColumns = mergedColumns.filter((field) => {
    if (field.visibility === "hidden") return false;
    const id = field.fieldName || field.name;
    return columnVisibility[id] ?? true;
  });
  const showIdDescription = visibleColumns.some((field) => {
    const id = field.fieldName || field.name;
    return id === "id";
  });

  if (visibleColumns.length === 0) return null;

  const displayedRows = data.slice(0, visibleCount);
  const hasMore = visibleCount < data.length;
  const titleField = visibleColumns[0];
  const otherFields = visibleColumns.slice(1);
  const rowSpacingClass =
    density === "compact" ? "gap-1 py-1" : density === "spacious" ? "gap-3 py-2" : "gap-2 py-1.5";
  const valueClass = wrapCells ? "text-right break-words" : "max-w-[200px] truncate text-right";

  return (
    <div className="space-y-3 md:hidden">
      {displayedRows.map((row, index) => {
        const rowId = String(row.id);
        return (
          <Card key={rowId || `row-${index}`} className="overflow-hidden border">
            <CardHeader className="pb-2">
              <CardTitle className={wrapCells ? "text-base" : "truncate text-base"}>
                {titleField
                  ? formatCellValue(resolveFieldValue(row, titleField), titleField)
                  : metadata?.verboseName || "Element"}
              </CardTitle>
              {showIdDescription ? (
                <CardDescription className="text-xs font-mono">ID: {rowId}</CardDescription>
              ) : null}
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
      })}
      {hasMore ? (
        <Button
          variant="outline"
          className="w-full"
          onClick={() =>
            setVisibleCount((current) => Math.min(current + MOBILE_BATCH_SIZE, data.length))
          }
        >
          Afficher plus ({data.length - visibleCount} restants)
        </Button>
      ) : null}
    </div>
  );
}
