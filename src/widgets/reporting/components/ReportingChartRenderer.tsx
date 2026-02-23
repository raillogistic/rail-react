import type { JSX } from "react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartContainer, ChartTooltipContent } from "@/shared/ui/kit/chart";
import type { ReportingChartSpec, ReportingColumn } from "@/widgets/reporting/types";
import { resolveColumnLabel } from "@/widgets/reporting/utils/format";

/**
 * Props for the chart renderer.
 * @property chart - Chart spec to render.
 * @property columns - Dataset columns (labels, kinds).
 * @property rows - Dataset rows.
 * @property height - Optional fixed height (defaults to 320px).
 */
export type ReportingChartRendererProps = {
  chart: ReportingChartSpec;
  columns: ReportingColumn[];
  rows: Array<Record<string, unknown>>;
  height?: number;
};

/**
 * Build a stable series color for a given field.
 *
 * @param index - Series index.
 * @returns CSS color.
 */
function defaultSeriesColor(index: number): string {
  const palette = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];
  return palette[index % palette.length];
}

/**
 * Recharts-based chart renderer for reporting widgets.
 *
 * This component is intentionally “config-first”: it renders whatever the backend
 * returns (rows/columns) and what the saved visualization config requests.
 */
export function ReportingChartRenderer({
  chart,
  columns,
  rows,
  height = 320,
}: ReportingChartRendererProps): JSX.Element {
  const series = chart.series ?? [];
  const xField = chart.x ?? columns.find((col) => col.kind === "dimension")?.name ?? columns[0]?.name;
  const yField =
    chart.y ?? columns.find((col) => col.kind === "metric" || col.kind === "computed")?.name;
  const valueField = chart.valueField ?? yField;
  const labelField = chart.labelField ?? xField;

  const chartConfig = useMemo(() => {
    const names = series.length > 0 ? series : yField ? [yField] : [];
    return Object.fromEntries(
      names.map((field, index) => [
        field,
        {
          label: resolveColumnLabel(columns, field),
          color: chart.colors?.[field] ?? defaultSeriesColor(index),
        },
      ]),
    );
  }, [chart.colors, columns, series, yField]);

  if (chart.kind === "table") {
    return (
      <div className="rounded-md border bg-background p-3 text-xs text-muted-foreground">
        Utilisez le widget tableau pour afficher les lignes.
      </div>
    );
  }

  if (chart.kind === "kpi") {
    const metric = yField ?? series[0];
    const value = metric ? (rows?.[0]?.[metric] as unknown) : undefined;
    return (
      <div className="flex h-[320px] flex-col items-center justify-center rounded-md border bg-card p-6">
        <div className="text-4xl font-bold">{value ?? "—"}</div>
        <div className="mt-2 text-xs text-muted-foreground">
          {metric ? resolveColumnLabel(columns, metric) : "Aucune mesure"}
        </div>
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-md border bg-card">
        <p className="text-xs text-muted-foreground">Aucune donnée.</p>
      </div>
    );
  }

  const activeSeries = series.length > 0 ? series : yField ? [yField] : [];

  if (chart.kind === "pie") {
    const pieValueField = valueField ?? activeSeries[0];
    const pieLabelField = labelField ?? xField;
    return (
      <div style={{ height }}>
        <ResponsiveContainer>
          <PieChart>
            <Tooltip />
            <Pie
              data={rows as unknown as Array<Record<string, unknown>>}
              dataKey={pieValueField}
              nameKey={pieLabelField}
              cx="50%"
              cy="50%"
              outerRadius={Math.min(120, Math.floor(height / 2.5))}
              label
              isAnimationActive={false}
            >
              {(rows ?? []).slice(0, 24).map((_, idx) => (
                <Cell key={`cell-${idx}`} fill={defaultSeriesColor(idx)} />
              ))}
            </Pie>
            {chart.showLegend !== false ? <Legend /> : null}
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chart.kind === "heatmap") {
    const x = xField ?? "x";
    const y = activeSeries[0] ?? yField ?? "y";
    return (
      <div style={{ height }}>
        <ResponsiveContainer>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={x} />
            <YAxis dataKey={y} />
            <Tooltip />
            <Scatter data={rows as any} fill="hsl(var(--chart-1))" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const container = (
    <ChartContainer config={chartConfig} className="w-full" style={{ height }}>
      {chart.kind === "bar" ? (
        <BarChart data={rows as any}>
          {chart.showGrid !== false ? <CartesianGrid strokeDasharray="3 3" /> : null}
          <XAxis dataKey={xField} />
          <YAxis />
          <Tooltip content={<ChartTooltipContent />} />
          {chart.showLegend !== false ? <Legend /> : null}
          {activeSeries.map((field) => (
            <Bar
              key={field}
              dataKey={field}
              fill={`var(--color-${field})`}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
              stackId={chart.stacked ? "stack" : undefined}
            />
          ))}
        </BarChart>
      ) : chart.kind === "area" ? (
        <AreaChart data={rows as any}>
          {chart.showGrid !== false ? <CartesianGrid strokeDasharray="3 3" /> : null}
          <XAxis dataKey={xField} />
          <YAxis />
          <Tooltip content={<ChartTooltipContent />} />
          {chart.showLegend !== false ? <Legend /> : null}
          {activeSeries.map((field) => (
            <Area
              key={field}
              type="monotone"
              dataKey={field}
              stroke={`var(--color-${field})`}
              fill={`var(--color-${field})`}
              fillOpacity={0.25}
              isAnimationActive={false}
              stackId={chart.stacked ? "stack" : undefined}
            />
          ))}
        </AreaChart>
      ) : chart.kind === "line" ? (
        <LineChart data={rows as any}>
          {chart.showGrid !== false ? <CartesianGrid strokeDasharray="3 3" /> : null}
          <XAxis dataKey={xField} />
          <YAxis />
          <Tooltip content={<ChartTooltipContent />} />
          {chart.showLegend !== false ? <Legend /> : null}
          {activeSeries.map((field) => (
            <Line
              key={field}
              type="monotone"
              dataKey={field}
              stroke={`var(--color-${field})`}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      ) : (
        <ComposedChart data={rows as any}>
          {chart.showGrid !== false ? <CartesianGrid strokeDasharray="3 3" /> : null}
          <XAxis dataKey={xField} />
          <YAxis />
          <Tooltip content={<ChartTooltipContent />} />
          {chart.showLegend !== false ? <Legend /> : null}
          {activeSeries.map((field) => (
            <Line
              key={field}
              type="monotone"
              dataKey={field}
              stroke={`var(--color-${field})`}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </ComposedChart>
      )}
    </ChartContainer>
  );

  return <div className="w-full">{container}</div>;
}
