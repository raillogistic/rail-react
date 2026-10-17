/** Generic Achat report page with URL-persisted filters and server exports. */

import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/kit/button";
import { ReportingExportMenu } from "./ReportingExportMenu";
import { ReportingFilterBar } from "./ReportingFilterBar";
import { ReportingGrid } from "./ReportingGrid";
import { useReportingReport } from "./useReportingReport";
import type { ReportingFilterValues } from "./types";

export type ReportingReportPageProps = {
  reportCode?: string;
  backPath?: string;
};

export const ReportingReportPage = ({
  reportCode,
  backPath,
}: ReportingReportPageProps) => {
  const { code } = useParams<{ code: string }>();
  const resolvedCode = reportCode ?? code ?? "";
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    data,
    loading,
    error,
    filters,
    updateFilters,
    fetchReport,
  } = useReportingReport(resolvedCode);

  useEffect(() => {
    const urlFilters: ReportingFilterValues = {};
    searchParams.forEach((value, key) => {
      urlFilters[key] = value;
    });
    updateFilters(urlFilters);
  }, [searchParams, updateFilters]);

  if (!resolvedCode) {
    return <div className="text-destructive">Parametre code manquant.</div>;
  }

  const handleFiltersChange = (newFilters: ReportingFilterValues) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        params.set(key, String(value));
      }
    });
    setSearchParams(params);
  };

  return (
    <div className="space-y-6" aria-busy={loading}>
      <div className="flex flex-wrap items-center gap-4">
        {backPath ? <Button
          variant="ghost"
          size="icon"
          aria-label="Retour"
          onClick={() => navigate(backPath)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button> : null}
        <div className="min-w-[240px] flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {data?.report.title || "Chargement..."}
          </h1>
          {data?.report.description ? (
            <p className="mt-1 text-muted-foreground">
              {data.report.description}
            </p>
          ) : null}
        </div>
        {data ? (
          <ReportingExportMenu
            reportCode={resolvedCode}
            filters={filters}
            formats={data.export_formats}
          />
        ) : null}
      </div>

      <ReportingFilterBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        availableFilters={data?.filters ?? []}
      />

      {loading && data ? (
        <div
          className="flex items-center gap-2 text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Actualisation des données…
        </div>
      ) : null}

      {loading && !data ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center text-destructive">
          <AlertCircle className="mb-4 h-12 w-12" />
          <h2 className="mb-2 text-xl font-semibold">Erreur</h2>
          <p className="mb-4 text-muted-foreground">{error.message}</p>
          <Button
            variant="outline"
            onClick={() => void fetchReport(filters)}
          >
            Reessayer
          </Button>
        </div>
      ) : data ? (
        <ReportingGrid
          blocks={data.visualizations}
          theme={data.report.theme}
        />
      ) : null}
    </div>
  );
};
