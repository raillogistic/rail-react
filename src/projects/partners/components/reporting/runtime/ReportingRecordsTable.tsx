/** Explicit-column table renderer for reporting record and aggregate rows. */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/kit/table";
import type {
  ReportingReportBlock,
  ReportingVisualizationColumn,
} from "./types";

export type ReportingRecordsTableProps = { block: ReportingReportBlock };

const formatValue = (
  value: unknown,
  format?: ReportingVisualizationColumn["format"],
): string => {
  if (value === null || value === undefined || value === "") return "—";
  if (format === "currency") {
    return `${new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value))} DA`;
  }
  if (format === "date" || format === "datetime") {
    const date = new Date(String(value));
    if (!Number.isNaN(date.getTime())) return date.toLocaleDateString("fr-FR");
  }
  return String(value);
};

export const ReportingRecordsTable = ({
  block,
}: ReportingRecordsTableProps) => {
  const rows = block.dataset.rows;
  const columns = block.visualization.config.columns ?? [];

  if (!columns.length) {
    return <div className="text-sm text-muted-foreground">Colonnes non configurees.</div>;
  }

  return (
    <div className="h-full overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.field} className="whitespace-nowrap">
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? (
            rows.map((row, rowIndex) => (
              <TableRow key={String(row.id ?? rowIndex)}>
                {columns.map((column) => (
                  <TableCell key={column.field} className="whitespace-nowrap">
                    {formatValue(row[column.field], column.format)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="py-8 text-center text-muted-foreground"
              >
                Aucun resultat
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
