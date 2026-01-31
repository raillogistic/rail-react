import { useTable } from "../context/TableContext";
import { useMetadata } from "../context/MetadataContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/lib/components/ui/card";
import { Skeleton } from "@/lib/components/ui/skeleton";
import { formatCellValue } from "../utils";

export function TableMobileCard() {
  const { metadata } = useMetadata();
  const { data, loading, columnOrder, columnVisibility } = useTable();

  if (!metadata) return null;

  // Loading state
  if (loading && data.length === 0) {
     return (
        <div className="space-y-4 md:hidden">
            {[1, 2, 3].map((i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-3 w-[100px]" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
     );
  }

  if (data.length === 0) {
      return (
        <div className="p-4 text-center text-muted-foreground md:hidden border rounded-md">
            No results found.
        </div>
      );
  }

  // Determine visible fields
  const visibleColumns = columnOrder
    .map((colId) => metadata.fields.find((f) => f.name === colId))
    .filter((f) => f && columnVisibility[f.name]);

  if (visibleColumns.length === 0) return null;

  return (
    <div className="space-y-4 md:hidden">
      {data.map((row) => {
        // Heuristic: First visible column is title
        const titleField = visibleColumns[0];
        const otherFields = visibleColumns.slice(1);
        const rowId = String(row.id);

        return (
            <Card key={rowId}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base truncate">
                        {titleField ? formatCellValue(row[titleField.name], titleField) : "Item"}
                    </CardTitle>
                    <CardDescription className="text-xs font-mono">
                        ID: {rowId}
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm">
                    {otherFields.map((field) => (
                        <div key={field!.name} className="flex justify-between py-1 border-b last:border-0">
                            <span className="font-medium text-muted-foreground">{field!.verboseName}:</span>
                            <span className="text-right truncate max-w-[200px]">
                                {formatCellValue(row[field!.name], field!)}
                            </span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
      })}
    </div>
  );
}
