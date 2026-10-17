/** KPI renderer for aggregate reporting rows. */

import { Card, CardContent } from "@/shared/ui/kit/card";
import type { ReportingReportBlock } from "./types";

export type ReportingKpiProps = { block: ReportingReportBlock };

const formatKpiValue = (value: number, format?: string): string => {
  if (format === "percent") {
    return new Intl.NumberFormat("fr-FR", {
      style: "percent",
      maximumFractionDigits: 2,
    }).format(value);
  }
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: format === "currency" ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
  if (format === "currency") return `${formatted} DA`;
  if (format === "days") return `${formatted} j`;
  return formatted;
};

export const ReportingKpi = ({ block }: ReportingKpiProps) => {
  const { visualization, dataset } = block;
  const metric =
    visualization.config.metric ??
    dataset.columns?.find((column) => column.kind === "metric")?.name;
  const column = dataset.columns?.find((item) => item.name === metric);
  const rawValue = metric ? dataset.rows[0]?.[metric] : undefined;
  const value = rawValue === null || rawValue === undefined || rawValue === ""
    ? Number.NaN
    : Number(rawValue);
  const format = visualization.config.format ?? column?.format;

  return (
    <Card className="flex h-full flex-col justify-center shadow-sm">
      <CardContent className="py-6">
        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground">
            {visualization.title}
          </span>
          <div className="text-3xl font-bold tracking-tight">
            {Number.isFinite(value) ? formatKpiValue(value, format) : "—"}
          </div>
          {visualization.description ? (
            <p className="text-xs text-muted-foreground">
              {visualization.description}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};
