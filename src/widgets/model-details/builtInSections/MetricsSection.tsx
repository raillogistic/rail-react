/**
 * @module MetricsSection
 * @description Section de métriques avec cartes KPI.
 * Supporte les tendances, les graphiques sparkline et les icônes personnalisées.
 */
import * as React from "react";
import { Card, CardContent } from "@/shared/ui/kit/card";
import { cn } from "@/shared/utils";
import type { SectionDefinition, SectionRuntimeCtx } from "../sectionTypes";
import UnitFieldRenderer from "../units/UnitFieldRenderer";
import type { UnitFieldInput } from "../units/unitFieldTypes";
import { TrendingDown, TrendingUp, Minus, Activity } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

export type MetricCard = {
  id: string;
  label: string;
  value: unknown;
  kind?: UnitFieldInput["kind"];
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "flat";
  trendValue?: string;
  chartData?: { value: number }[];
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
  actions?: SectionDefinition<MetricsSectionData>["actions"];
  skeleton?: SectionDefinition<MetricsSectionData>["skeleton"];
  empty?: SectionDefinition<MetricsSectionData>["empty"];
  error?: SectionDefinition<MetricsSectionData>["error"];
  testId?: string;
};

/** Extrait les métriques depuis les données de la section. */
function resolveMetricCards(
  data: MetricsSectionData | undefined,
): MetricCard[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Array.isArray(data.metrics) ? data.metrics : [];
}

/** Génère les classes CSS de grille pour les colonnes de métriques. */
function resolveMetricColumns(columns?: number): string {
  const normalized = Math.max(1, Math.min(columns ?? 4, 4));
  const base = ["grid grid-cols-1 gap-3"];
  if (normalized >= 2) base.push("sm:grid-cols-2");
  if (normalized >= 3) base.push("lg:grid-cols-3");
  if (normalized >= 4) base.push("2xl:grid-cols-4");
  return base.join(" ");
}

/** Indicateur visuel de tendance (hausse, baisse, stable). */
function TrendIndicator({
  trend,
  value,
}: {
  trend?: MetricCard["trend"];
  value?: string;
}) {
  if (!trend) return null;

  const Icon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const toneClass =
    trend === "up"
      ? "text-emerald-600 bg-emerald-500/10"
      : trend === "down"
        ? "text-rose-600 bg-rose-500/10"
        : "text-muted-foreground bg-muted/20";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
        toneClass,
      )}
    >
      <Icon className="size-3" />
      {value || (trend === "up" ? "Up" : trend === "down" ? "Down" : "Flat")}
    </div>
  );
}

export function createMetricsSection(
  config: MetricsSectionConfig,
): SectionDefinition<MetricsSectionData> {
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
            <Card
              key={metric.id}
              className="group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/15 bg-card/50 border-border/50"
            >
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-primary/8 text-primary transition-transform group-hover:scale-105">
                      {metric.icon || <Activity className="size-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-muted-foreground/70 leading-tight truncate">
                        {metric.label}
                      </div>
                      <div className="mt-0.5">
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
                          className="text-xl font-bold tracking-tight"
                          defaultLocale={runtime.locale}
                          defaultTimezone={runtime.timezone}
                        />
                      </div>
                    </div>
                  </div>
                  <TrendIndicator
                    trend={metric.trend}
                    value={metric.trendValue}
                  />
                </div>

                <div className="mt-3 h-[50px] w-full relative">
                  {metric.chartData ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metric.chartData}>
                        <defs>
                          <linearGradient
                            id={`gradient-${metric.id}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="var(--color-primary)"
                              stopOpacity={0.2}
                            />
                            <stop
                              offset="95%"
                              stopColor="var(--color-primary)"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="var(--color-primary)"
                          strokeWidth={1.5}
                          fillOpacity={1}
                          fill={`url(#gradient-${metric.id})`}
                          isAnimationActive={true}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : metric.chart ? (
                    <div className="h-full w-full">{metric.chart}</div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center border border-dashed border-border/30 rounded-lg bg-muted/5">
                      <div className="h-px w-2/3 bg-gradient-to-r from-transparent via-border/40 to-transparent" />
                    </div>
                  )}
                </div>

                {metric.hint && (
                  <div className="mt-2 text-[11px] text-muted-foreground/60 italic">
                    {metric.hint}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      );
    },
  };
}

export default createMetricsSection;
