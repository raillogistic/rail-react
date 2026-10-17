/** Server-side export menu for the current report and filters. */

import { useState } from "react";
import { useMutation } from "@apollo/client";
import {
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react";
import { CREATE_REPORTING_EXPORT_JOB_MUTATION } from "../../../api/reporting";
import { downloadBinaryFile } from "../exportUtils";
import { getRuntimeBackendConfig } from "@/shared/config/backend-endpoint";
import { Button } from "@/shared/ui/kit/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";
import { toast } from "@/shared/ui/kit/sonner";
import type {
  ReportingExportFormat,
  ReportingFilterValues,
} from "./types";

export type ReportingExportMenuProps = {
  reportCode: string;
  filters: ReportingFilterValues;
  formats: ReportingExportFormat[];
};

type ExportMutationData = {
  reportingExportJobCreate?: {
    status?: string | null;
    message?: string | null;
    data?: { fileUrl?: string | null; fileName?: string | null } | null;
  } | null;
};

const FORMAT_LABELS: Record<ReportingExportFormat, string> = {
  xlsx: "Excel (XLSX)",
  csv: "CSV",
  pdf: "PDF",
  json: "JSON",
};

export const ReportingExportMenu = ({
  reportCode,
  filters,
  formats,
}: ReportingExportMenuProps) => {
  const [createExportJob] = useMutation<ExportMutationData>(
    CREATE_REPORTING_EXPORT_JOB_MUTATION,
  );
  const [isExporting, setIsExporting] =
    useState<ReportingExportFormat | null>(null);

  const handleExport = async (format: ReportingExportFormat) => {
    setIsExporting(format);
    try {
      const response = await createExportJob({
        variables: {
          reportCode,
          format,
          filters,
        },
      });
      const result = response.data?.reportingExportJobCreate;
      if (result?.status !== "success" || !result.data?.fileUrl) {
        throw new Error(result?.message || "Impossible de generer l'export.");
      }
      const url = new URL(
        result.data.fileUrl,
        `${getRuntimeBackendConfig().backendUrl}/`,
      ).toString();
      await downloadBinaryFile(
        url,
        result.data.fileName || `rapport-${reportCode}.${format}`,
      );
      toast.success("Export telecharge");
    } catch (caught) {
      toast.error("Erreur d'export", {
        description:
          caught instanceof Error ? caught.message : "Une erreur est survenue",
      });
    } finally {
      setIsExporting(null);
    }
  };

  if (!formats.length) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={Boolean(isExporting)}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Exporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {formats.map((format) => (
          <DropdownMenuItem
            key={format}
            onClick={() => void handleExport(format)}
          >
            {format === "xlsx" ? (
              <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
            ) : format === "json" ? (
              <FileJson className="mr-2 h-4 w-4 text-yellow-600" />
            ) : (
              <FileText className="mr-2 h-4 w-4 text-blue-600" />
            )}
            {FORMAT_LABELS[format]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
