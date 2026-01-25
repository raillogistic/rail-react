import type { JSX } from "react";
import { useCallback, useMemo } from "react";
import { FileText } from "lucide-react";

import { Button } from "@/lib/components/ui/button";
import type { ReportingColumn } from "@/lib/reporting/types";
import { stringifyCellValue } from "@/lib/reporting/utils/format";

/**
 * Props for the PDF exporter.
 * @property columns - Column definitions used to order and label the export.
 * @property rows - Row data returned by the reporting engine.
 * @property filename - Output filename (defaults to "report.pdf").
 * @property title - Optional document title printed in the header.
 * @property subtitle - Optional document subtitle printed under the title.
 * @property maxRows - Max number of rows exported (defaults to 1000).
 * @property disabled - Whether the export action is disabled.
 */
export type ReportingPdfExporterProps = {
  columns: ReportingColumn[];
  rows: Array<Record<string, unknown>>;
  filename?: string;
  title?: string;
  subtitle?: string;
  maxRows?: number;
  disabled?: boolean;
};

/**
 * PDF exporter button that generates a PDF file using jsPDF + autoTable.
 *
 * Implementation note: uses dynamic import so PDF dependencies are loaded only
 * when needed.
 */
export function ReportingPdfExporter({
  columns,
  rows,
  filename = "report.pdf",
  title = "Reporting",
  subtitle,
  maxRows = 1000,
  disabled,
}: ReportingPdfExporterProps): JSX.Element {
  const orderedFields = useMemo(() => columns.map((col) => col.name), [columns]);
  const limitedRows = useMemo(() => rows.slice(0, Math.max(0, maxRows)), [maxRows, rows]);

  const exportPdf = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const margin = 40;

    doc.setFontSize(16);
    doc.text(title, margin, 32);
    if (subtitle) {
      doc.setFontSize(10);
      doc.text(subtitle, margin, 50);
    }

    const head = [columns.map((col) => col.label)];
    const body = limitedRows.map((row) =>
      orderedFields.map((field) => stringifyCellValue(row[field])),
    );

    autoTable(doc, {
      head,
      body,
      startY: subtitle ? 70 : 54,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [35, 38, 45] },
      margin: { left: margin, right: margin },
    });

    doc.save(filename);
  }, [columns, filename, limitedRows, orderedFields, subtitle, title]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => void exportPdf()}
      disabled={disabled || rows.length === 0 || columns.length === 0}
      title="Exporter en PDF"
    >
      <FileText className="mr-2 h-4 w-4" />
      PDF
    </Button>
  );
}
