import type { JSX } from "react";
import { useMemo } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/kit/table";
import type { ReportingColumn } from "@/widgets/reporting/types";
import { stringifyCellValue } from "@/widgets/reporting/utils/format";

/**
 * Props for the reporting table widget.
 * @property columns - Column definitions for display labels.
 * @property rows - Row data returned by the reporting engine.
 * @property maxRows - Maximum number of rows rendered (defaults to 50).
 */
export type ReportingTableWidgetProps = {
  columns: ReportingColumn[];
  rows: Array<Record<string, unknown>>;
  maxRows?: number;
};

/**
 * Render a table preview for a reporting result.
 */
export function ReportingTableWidget({
  columns,
  rows,
  maxRows = 50,
}: ReportingTableWidgetProps): JSX.Element {
  const safeRows = useMemo(() => rows.slice(0, Math.max(0, maxRows)), [maxRows, rows]);

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.name} className="text-xs">
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {safeRows.map((row, idx) => (
            <TableRow key={idx}>
              {columns.map((col) => (
                <TableCell key={col.name} className="text-xs">
                  {stringifyCellValue(row[col.name])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length > safeRows.length ? (
        <div className="border-t p-2 text-xs text-muted-foreground">
          {safeRows.length} / {rows.length} lignes affichées
        </div>
      ) : null}
    </div>
  );
}
