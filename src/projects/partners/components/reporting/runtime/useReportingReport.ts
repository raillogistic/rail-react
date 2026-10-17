/** Executes one reporting catalog entry with URL-friendly filter values. */

import { useCallback, useState } from "react";
import { useMutation } from "@apollo/client";
import { BUILD_REPORTING_REPORT_MUTATION } from "../../../api/reporting";
import type {
  ReportingBuildPayloadResponse,
  ReportingFilterValues,
} from "./types";

type BuildMutationData = {
  reportingReportBuildPayload?: {
    status?: string | null;
    message?: string | null;
    data?: ReportingBuildPayloadResponse | null;
  } | null;
};

const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error("Erreur de chargement du rapport");

export const useReportingReport = (reportCode: string) => {
  const [filters, setFilters] = useState<ReportingFilterValues>({});
  const [data, setData] = useState<ReportingBuildPayloadResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [buildPayload] = useMutation<BuildMutationData>(
    BUILD_REPORTING_REPORT_MUTATION,
  );

  const fetchReport = useCallback(
    async (currentFilters: ReportingFilterValues = {}) => {
      if (!reportCode) return;
      setLoading(true);
      setError(null);
      try {
        const response = await buildPayload({
          variables: {
            code: reportCode,
            filters: currentFilters,
          },
        });
        const result = response.data?.reportingReportBuildPayload;
        if (result?.status !== "success" || !result.data) {
          throw new Error(result?.message || "Erreur de chargement du rapport");
        }
        setData(result.data);
      } catch (caught) {
        setError(toError(caught));
      } finally {
        setLoading(false);
      }
    },
    [buildPayload, reportCode],
  );

  const updateFilters = useCallback(
    (newFilters: ReportingFilterValues) => {
      setFilters(newFilters);
      void fetchReport(newFilters);
    },
    [fetchReport],
  );

  return { data, loading, error, filters, updateFilters, fetchReport };
};
