import { MoreHorizontal } from "lucide-react";
import {
  TableRow as ShadcnTableRow,
  TableCell,
} from "./TableFrame";
import { Checkbox } from "@/lib/components/ui/checkbox";
import { Button } from "@/lib/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import { useTable } from "../context/TableContext";
import { useMetadata } from "../context/MetadataContext";
import { formatCellValue } from "../utils";

export function TableRows() {
  const { metadata } = useMetadata();
  const {
    data,
    loading,
    columnOrder,
    columnVisibility,
    rowSelection,
    setRowSelection,
  } = useTable();

  if (!metadata) return null;

  const visibleColumns = columnOrder
    .map((colId) => metadata.fields.find((f) => f.name === colId))
    .filter((f) => f && columnVisibility[f.name]);

  const handleRowSelect = (rowId: string, checked: boolean) => {
    setRowSelection({
      ...rowSelection,
      [rowId]: checked,
    });
  };

  if (loading && data.length === 0) {
    return (
      <ShadcnTableRow>
        <TableCell
          colSpan={visibleColumns.length + 2}
          className="h-24 text-center"
        >
          Loading...
        </TableCell>
      </ShadcnTableRow>
    );
  }

  if (data.length === 0) {
    return (
      <ShadcnTableRow>
        <TableCell
          colSpan={visibleColumns.length + 2}
          className="h-24 text-center"
        >
          No results.
        </TableCell>
      </ShadcnTableRow>
    );
  }

  return (
    <>
      {data.map((row) => {
        const rowId = String(row.id);
        return (
        <ShadcnTableRow
          key={rowId}
          data-state={rowSelection[rowId] && "selected"}
        >
          {/* Selection Cell */}
          <TableCell>
            <Checkbox
              checked={!!rowSelection[rowId]}
              onCheckedChange={(checked) =>
                handleRowSelect(rowId, checked as boolean)
              }
              aria-label="Select row"
            />
          </TableCell>

          {/* Data Cells */}
          {visibleColumns.map((field) => (
            <TableCell key={field!.name}>
              {formatCellValue(row[field!.name], field!)}
            </TableCell>
          ))}

          {/* Actions Cell */}
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(rowId)}
                >
                  Copy ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>View Details</DropdownMenuItem>
                <DropdownMenuItem>Edit</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </ShadcnTableRow>
      )})}
    </>
  );
}
