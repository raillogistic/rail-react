import type { JSX } from "react";

import type { ReportingColumn } from "@/lib/reporting/types";
import { ReportingExcelExporter } from "@/lib/reporting/exporters/ReportingExcelExporter";
import { ReportingPdfExporter } from "@/lib/reporting/exporters/ReportingPdfExporter";

/**
 * Props for the export toolbar.
 * @property columns - Column definitions used for exports.
 * @property rows - Row data to export.
 * @property title - Optional title used for PDF export and filename prefixes.
 * @property disabled - Whether exports are disabled.
 */
export type ReportingExportToolbarProps = {
  columns: ReportingColumn[];
  rows: Array<Record<string, unknown>>;
  title?: string;
  disabled?: boolean;
};

/**
 * Export toolbar that groups Excel/PDF exporters.
 */
export function ReportingExportToolbar({
  columns,
  rows,
  title,
  disabled,
}: ReportingExportToolbarProps): JSX.Element {
  const safeBase = (title || "reporting").toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ReportingExcelExporter
        columns={columns}
        rows={rows}
        filename={`${safeBase}.xlsx`}
        disabled={disabled}
      />
      <ReportingPdfExporter
        columns={columns}
        rows={rows}
        filename={`${safeBase}.pdf`}
        title={title || "Reporting"}
        subtitle={`${rows.length} lignes`}
        disabled={disabled}
      />
    </div>
  );
}
