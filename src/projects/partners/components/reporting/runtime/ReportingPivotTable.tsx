/** Reusable Partners implementation using the host Rail runtime. */
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/kit/table";
import type { ReportingReportBlock } from "./types";

export type ReportingPivotTableProps = { block: ReportingReportBlock };

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "—";
  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value))} DA`;
};

export const ReportingPivotTable = ({ block }: ReportingPivotTableProps) => {
  const rows = block.dataset.rows;
  const config = block.visualization.config;

  const rowField = String(config.row || "");
  const colField = String(config.column || "");
  const valField = String(config.value || "");

  if (!rowField || !colField || !valField) {
    return <div className="text-sm text-muted-foreground">Configuration pivot invalide.</div>;
  }

  // Get distinct columns
  const colSet = new Set<string>();
  rows.forEach((r) => {
    if (r[colField]) colSet.add(String(r[colField]));
  });
  const distinctCols = Array.from(colSet).sort();

  // Group data by row
  const rowMap = new Map<string, Record<string, number>>();
  rows.forEach((r) => {
    const rKey = String(r[rowField] || "Inconnu");
    const cKey = String(r[colField] || "Inconnu");
    const v = Number(r[valField]) || 0;

    if (!rowMap.has(rKey)) {
      rowMap.set(rKey, {});
    }
    const current = rowMap.get(rKey)!;
    current[cKey] = (current[cKey] || 0) + v;
  });

  const distinctRows = Array.from(rowMap.keys()).sort();

  return (
    <div className="h-full overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
          <TableRow>
            <TableHead className="whitespace-nowrap font-bold">
              {String(rowField)}
            </TableHead>
            {distinctCols.map((col) => (
              <TableHead key={col} className="whitespace-nowrap text-right">
                {col}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {distinctRows.length ? (
            distinctRows.map((rKey) => (
              <TableRow key={rKey}>
                <TableCell className="whitespace-nowrap font-medium">
                  {rKey}
                </TableCell>
                {distinctCols.map((col) => {
                  const val = rowMap.get(rKey)?.[col];
                  return (
                    <TableCell key={col} className="whitespace-nowrap text-right">
                      {val !== undefined ? formatValue(val) : "—"}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={distinctCols.length + 1}
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
