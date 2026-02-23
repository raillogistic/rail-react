import type { JSX } from "react";
import { useMemo } from "react";
import { AlertTriangle, Sigma } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import type { ReportingQueryResult } from "@/widgets/reporting/types";
import { computeMetricSummaries, computeOutliers } from "@/widgets/reporting/utils/insights";

/**
 * Props for the insights panel.
 * @property result - Query result used to compute summaries/outliers.
 * @property title - Optional title override for the panel.
 */
export type ReportingInsightsPanelProps = {
  result: ReportingQueryResult;
  title?: string;
};

/**
 * Render “smart” insights derived from a reporting result (no extra queries).
 */
export function ReportingInsightsPanel({ result, title = "Insights" }: ReportingInsightsPanelProps): JSX.Element {
  const summaries = useMemo(() => computeMetricSummaries(result), [result]);
  const outliers = useMemo(() => computeOutliers(result), [result]);

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">{title}</CardTitle>
          <Sigma className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          {summaries.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucune mesure numérique détectée.</p>
          ) : (
            <div className="space-y-2">
              {summaries.slice(0, 6).map((summary) => (
                <div key={summary.field} className="rounded-md border p-2">
                  <div className="text-xs font-semibold">{summary.label}</div>
                  <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>Total: {summary.sum.toFixed(2)}</div>
                    <div>Moyenne: {summary.avg.toFixed(2)}</div>
                    <div>Min: {summary.min.toFixed(2)}</div>
                    <div>Max: {summary.max.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Anomalies</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          {outliers.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucune anomalie détectée.</p>
          ) : (
            <div className="space-y-2">
              {outliers.map((outlier) => (
                <div key={`${outlier.field}-${outlier.rowIndex}`} className="rounded-md border p-2">
                  <div className="text-xs font-semibold">{outlier.field}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Ligne #{outlier.rowIndex + 1}: {outlier.value} (z={outlier.zScore.toFixed(2)})
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
