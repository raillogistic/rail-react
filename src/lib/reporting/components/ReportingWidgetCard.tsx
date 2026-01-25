import type { JSX } from "react";
import { useMemo } from "react";
import { AlertCircle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/lib/components/ui/tabs";
import type { ReportingChartSpec, ReportingColumn, ReportingQueryResult } from "@/lib/reporting/types";
import { ReportingChartRenderer } from "@/lib/reporting/components/ReportingChartRenderer";
import { ReportingExportToolbar } from "@/lib/reporting/components/ReportingExportToolbar";
import { ReportingInsightsPanel } from "@/lib/reporting/components/ReportingInsightsPanel";
import { ReportingTableWidget } from "@/lib/reporting/components/ReportingTableWidget";

/**
 * Props for the reporting widget card.
 * @property title - Widget title.
 * @property description - Optional widget description.
 * @property chart - Chart spec to render.
 * @property result - Query result payload.
 * @property columns - Column metadata (fallbacks to result columns).
 */
export type ReportingWidgetCardProps = {
  title: string;
  description?: string | null;
  chart: ReportingChartSpec;
  result: ReportingQueryResult;
  columns?: ReportingColumn[];
};

/**
 * Report widget card rendering a chart/table/insights from a query result payload.
 */
export function ReportingWidgetCard({
  title,
  description,
  chart,
  result,
  columns,
}: ReportingWidgetCardProps): JSX.Element {
  const effectiveColumns = useMemo<ReportingColumn[]>(() => {
    const direct = columns ?? result.columns ?? [];
    if (direct.length > 0) return direct;
    const first = result.rows?.[0] ?? {};
    return Object.keys(first).map((name) => ({ name, label: name }));
  }, [columns, result.columns, result.rows]);
  const rows = result.rows ?? [];
  const warnings = result.warnings ?? [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm">{title}</CardTitle>
            {description ? <CardDescription className="text-xs">{description}</CardDescription> : null}
          </div>
          <ReportingExportToolbar columns={effectiveColumns} rows={rows} title={title} />
        </div>
        {warnings.length > 0 ? (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <div className="space-y-1">
              <div className="font-semibold">Avertissements BI</div>
              <ul className="list-disc pl-4">
                {warnings.slice(0, 4).map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-3">
        <Tabs defaultValue={chart.kind === "table" ? "table" : "chart"}>
          <TabsList>
            <TabsTrigger value="chart">Graphique</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
          <TabsContent value="chart">
            <ReportingChartRenderer chart={chart} columns={effectiveColumns} rows={rows} />
          </TabsContent>
          <TabsContent value="table">
            <ReportingTableWidget columns={effectiveColumns} rows={rows} />
          </TabsContent>
          <TabsContent value="insights">
            <ReportingInsightsPanel result={result} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
