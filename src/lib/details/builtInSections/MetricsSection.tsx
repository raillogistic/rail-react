import * as React from "react";
import { Card, CardContent } from "@/lib/components/ui/card";
import { cn } from "@/lib/utils";
import type { SectionDefinition, SectionRuntimeCtx } from "../sectionTypes";
import UnitFieldRenderer from "../units/UnitFieldRenderer";
import type { UnitFieldInput } from "../units/unitFieldTypes";

export type MetricCard = {
  id: string;
  label: string;
  value: unknown;
  kind?: UnitFieldInput["kind"];
  hint?: React.ReactNode;
  trend?: "up" | "down" | "flat";
  chart?: React.ReactNode;
};

export type MetricsSectionData =
  | MetricCard[]
  | {
      metrics: MetricCard[];
    };

export type MetricsSectionConfig = {
  id: string;
  title?: string;
  description?: string;
  order?: number;
  columns?: number;
  loadingStrategy?: "eager" | "lazy";
  permissions?: string[];
  visibleIf?: (ctx: SectionRuntimeCtx) => boolean;
  disabledIf?: SectionDefinition<MetricsSectionData>["disabledIf"];
  select?: (ctx: SectionRuntimeCtx) => MetricsSectionData | undefined;
  load?: SectionDefinition<MetricsSectionData>["load"];
  skeleton?: SectionDefinition<MetricsSectionData>["skeleton"];
  empty?: SectionDefinition<MetricsSectionData>["empty"];
  error?: SectionDefinition<MetricsSectionData>["error"];
  testId?: string;
};

function resolveMetricCards(data: MetricsSectionData | undefined): MetricCard[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Array.isArray(data.metrics) ? data.metrics : [];
}

function resolveMetricColumns(columns?: number): string {
  const normalized = Math.max(1, Math.min(columns ?? 4, 4));
  const base = ["grid grid-cols-1 gap-3"];
  if (normalized >= 2) base.push("sm:grid-cols-2");
  if (normalized >= 3) base.push("lg:grid-cols-3");
  if (normalized >= 4) base.push("2xl:grid-cols-4");
  return base.join(" ");
}

function trendTone(trend: MetricCard["trend"]): string {
  if (trend === "up") return "text-emerald-600";
  if (trend === "down") return "text-rose-600";
  return "text-muted-foreground";
}

export function createMetricsSection(config: MetricsSectionConfig): SectionDefinition<MetricsSectionData> {
  return {
    ...config,
    kind: "metrics",
    dataSource: "computed",
    loadingStrategy: config.loadingStrategy ?? "lazy",
    render: ({ data, runtime }) => {
      const metrics = resolveMetricCards(data);
      return (
        <div className={resolveMetricColumns(config.columns)}>
          {metrics.map((metric) => (
            <Card key={metric.id} className="gap-0 py-0">
              <CardContent className="space-y-2 px-4 py-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  {metric.label}
                </div>
                <UnitFieldRenderer
                  field={{
                    id: `${metric.id}-value`,
                    label: metric.label,
                    value: metric.value,
                    hint: metric.hint,
                    kind: metric.kind ?? "number",
                  }}
                  mode="valueOnly"
                  density="compact"
                  defaultLocale={runtime.locale}
                  defaultTimezone={runtime.timezone}
                />
                {metric.trend ? (
                  <div className={cn("text-xs font-medium", trendTone(metric.trend))}>
                    {metric.trend === "up"
                      ? "Trending up"
                      : metric.trend === "down"
                        ? "Trending down"
                        : "Stable"}
                  </div>
                ) : null}
                {metric.chart ? (
                  <div className="min-h-12 rounded border border-dashed p-2">{metric.chart}</div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      );
    },
  };
}

export default createMetricsSection;
