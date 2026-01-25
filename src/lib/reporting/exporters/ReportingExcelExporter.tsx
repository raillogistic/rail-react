import type { JSX } from "react";
import { useCallback, useMemo } from "react";
import { FileSpreadsheet } from "lucide-react";

import { Button } from "@/lib/components/ui/button";
import type { ReportingColumn } from "@/lib/reporting/types";
import { stringifyCellValue } from "@/lib/reporting/utils/format";

/**
 * Props for the Excel exporter.
 * @property columns - Column definitions used to order and label the export.
 * @property rows - Row data returned by the reporting engine.
 * @property filename - Output filename (defaults to "report.xlsx").
 * @property sheetName - Excel sheet name (defaults to "Data").
 * @property disabled - Whether the export action is disabled.
 */
export type ReportingExcelExporterProps = {
  columns: ReportingColumn[];
  rows: Array<Record<string, unknown>>;
  filename?: string;
  sheetName?: string;
  disabled?: boolean;
};

/**
 * Excel exporter button that generates an XLSX file using SheetJS (`xlsx`).
 *
 * Implementation note: uses dynamic import so the XLSX dependency is loaded only
 * when needed (keeps main bundle smaller).
 */
export function ReportingExcelExporter({
  columns,
  rows,
  filename = "report.xlsx",
  sheetName = "Data",
  disabled,
}: ReportingExcelExporterProps): JSX.Element {
  const orderedFields = useMemo(() => columns.map((col) => col.name), [columns]);

  const exportExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const header = columns.map((col) => col.label);
    const data = rows.map((row) =>
      orderedFields.map((field) => stringifyCellValue(row[field])),
    );

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, filename, { compression: true });
  }, [columns, filename, orderedFields, rows, sheetName]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => void exportExcel()}
      disabled={disabled || rows.length === 0 || columns.length === 0}
      title="Exporter en Excel"
    >
      <FileSpreadsheet className="mr-2 h-4 w-4" />
      Excel
    </Button>
  );
}
