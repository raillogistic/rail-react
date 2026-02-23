import type { JSX } from "react";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/kit/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shared/ui/kit/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/kit/table";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Column exposed by a reporting dataset.
 * @property name Unique identifier used in dataset rows.
 * @property label Human-readable label for rendering.
 * @property kind Optional semantic type (dimension/metric/computed).
 */
export type ReportingColumn = {
  name: string;
  label: string;
  kind?: "dimension" | "metric" | "computed";
};

/**
 * Visualization definition aligned with `ReportingVisualization.render`.
 * @property code Stable identifier used as key.
 * @property title Card title displayed in the UI.
 * @property kind Visualization type supported by the reporting extension.
 * @property description Optional helper text for the widget.
 * @property config Optional mapping for axes/series/value fields.
 */
export type ReportingVisualization = {
  code: string;
  title: string;
  kind: "table" | "bar" | "line" | "pie" | "kpi";
  description?: string;
  config?: {
    x?: string;
    y?: string;
    series?: string[];
    value_field?: string;
    label_field?: string;
  };
};

/**
 * Props supplied to a visualization card.
 * @property visualization Visual definition to render.
 * @property columns Dataset columns used for labels and axes.
 * @property rows Dataset rows rendered by the widget.
 */
type Props = {
  visualization: ReportingVisualization;
  columns: ReportingColumn[];
  rows: Array<Record<string, any>>;
};

const resolveLabel = (columns: ReportingColumn[], field: string): string =>
  columns.find((c) => c.name === field)?.label ?? field;

/**
 * Generic renderer for reporting visualizations (table, bar, line, pie, KPI)
 * driven directly by dataset rows and the visualization configuration.
 */
export function ReportingVisualizationCard({
  visualization,
  columns,
  rows,
}: Props): JSX.Element {
  const { kind, title, description, config } = visualization;

  if (kind === "table") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.name}>{col.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow key={`${visualization.code}-${idx}`}>
                  {columns.map((col) => (
                    <TableCell key={col.name}>{String(row[col.name] ?? "")}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  const xField = config?.x ?? columns[0]?.name ?? "x";
  const yField = config?.y ?? columns[1]?.name ?? "y";
  const series = config?.series ?? [yField];

  const chartConfig = Object.fromEntries(
    series.map((serie, index) => [
      serie,
      {
        label: resolveLabel(columns, serie),
        color: ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"][
          index % 3
        ],
      },
    ])
  );

  const renderCartesian = (line = false) => (
    <ChartContainer config={chartConfig} className="h-72">
      {line ? (
        <LineChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xField} />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          {series.map((serie) => (
            <Line
              key={serie}
              type="monotone"
              dataKey={serie}
              stroke={`var(--color-${serie})`}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      ) : (
        <BarChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xField} />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          {series.map((serie) => (
            <Bar
              key={serie}
              dataKey={serie}
              fill={`var(--color-${serie})`}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      )}
    </ChartContainer>
  );

  if (kind === "bar") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        <CardContent>{renderCartesian(false)}</CardContent>
      </Card>
    );
  }

  if (kind === "line") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        <CardContent>{renderCartesian(true)}</CardContent>
      </Card>
    );
  }

  if (kind === "pie") {
    const valueField = config?.value_field ?? yField;
    const labelField = config?.label_field ?? xField;
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer>
            <PieChart>
              <Tooltip />
              <Pie
                data={rows}
                dataKey={valueField}
                nameKey={labelField}
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }

  // KPI fallback: show first metric of first row
  const kpiValue = rows?.[0]?.[yField];
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{kpiValue ?? "N/A"}</div>
        <p className="text-xs text-muted-foreground">
          {resolveLabel(columns, yField)}
        </p>
      </CardContent>
    </Card>
  );
}
