/** Recharts renderer aligned with the Rail-Django reporting payload. */

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  ScatterChart,
  Scatter,
  Treemap,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ZAxis,
  LabelList,
} from "recharts";
import type { ReportingReportBlock } from "./types";

const DEFAULT_COLORS = [
  "#2563eb", // blue-600
  "#16a34a", // green-600
  "#eab308", // yellow-500
  "#dc2626", // red-600
  "#9333ea", // purple-600
  "#0891b2", // cyan-600
  "#f97316", // orange-500
  "#4f46e5", // indigo-600
  "#db2777", // pink-600
  "#64748b", // slate-500
];

export type ReportingChartFactoryProps = {
  block: ReportingReportBlock;
  theme?: string;
};

const CustomizedTreemapContent = (props: {
  colors: string[]; depth?: number; x?: number; y?: number;
  width?: number; height?: number; index?: number; name?: string;
}) => {
  const { depth = 0, x = 0, y = 0, width = 0, height = 0, index = 0, colors, name } = props;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: depth < 2 ? colors[index % colors.length] : "none",
          stroke: "#fff",
          strokeWidth: 2 / (depth + 1e-10),
          strokeOpacity: 1 / (depth + 1e-10),
        }}
      />
      {depth === 1 && width > 30 && height > 20 ? (
        <text
          x={x + width / 2}
          y={y + height / 2 + 5}
          textAnchor="middle"
          fill="#fff"
          fontSize={12}
          className="pointer-events-none"
        >
          {name}
        </text>
      ) : null}
    </g>
  );
};

export const ReportingChartFactory = ({ block }: ReportingChartFactoryProps) => {
  const { visualization } = block;
  const data = block.dataset.rows;
  const config = visualization.config || {};
  const kind = visualization.kind;

  const xAxis = config.x_axis || config.category || "name";
  const configuredY = config.y_axis || config.value || config.metric;
  const yAxes = Array.isArray(configuredY)
    ? configuredY
    : configuredY
      ? [configuredY]
      : ["value"];
  const colors = Array.isArray(config.colors) && config.colors.length > 0 ? config.colors : DEFAULT_COLORS;

  if (!data.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Aucune donnee disponible
      </div>
    );
  }

  const renderTooltip = () => (
    <Tooltip
      contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
    />
  );

  switch (kind) {
    case "bar":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey={xAxis} tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            {renderTooltip()}
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            {yAxes.map((yKey, index) => (
              <Bar
                key={yKey}
                dataKey={yKey}
                fill={colors[index % colors.length]}
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );

    case "line":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey={xAxis} tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            {renderTooltip()}
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            {yAxes.map((yKey, index) => (
              <Line
                key={yKey}
                type="monotone"
                dataKey={yKey}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );

    case "area":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey={xAxis} tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            {renderTooltip()}
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            {yAxes.map((yKey, index) => (
              <Area
                key={yKey}
                type="monotone"
                dataKey={yKey}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );

    case "pie":
    case "donut": {
      const isDonut = kind === "donut";
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {renderTooltip()}
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Pie
              data={data}
              dataKey={yAxes[0]}
              nameKey={xAxis}
              cx="50%"
              cy="50%"
              innerRadius={isDonut ? "60%" : 0}
              outerRadius="80%"
              paddingAngle={isDonut ? 2 : 0}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      );
    }

    case "funnel":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" hide />
            <YAxis dataKey={xAxis} type="category" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            {renderTooltip()}
            {yAxes.map((yKey, index) => (
              <Bar
                key={yKey}
                dataKey={yKey}
                fill={colors[index % colors.length]}
                radius={[0, 4, 4, 0]}
                barSize={30}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );

    case "gauge": {
      const target = Number(config.target ?? config.max ?? 100);
      const value = data.length ? Number(data[0][yAxes[0]]) || 0 : 0;
      const gaugeData = [
        { name: "Valeur", value: value, fill: value > target ? "#dc2626" : "#2563eb" },
        { name: "Restant", value: Math.max(target - value, 0), fill: "#e2e8f0" },
      ];
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={gaugeData}
              cx="50%"
              cy="70%"
              startAngle={180}
              endAngle={0}
              innerRadius="60%"
              outerRadius="80%"
              dataKey="value"
              stroke="none"
            >
               {gaugeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
            <text x="50%" y="65%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {String(value)}
            </text>
            <text x="50%" y="80%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '12px', fill: '#64748b' }}>
              Objectif: {String(target)}
            </text>
          </PieChart>
        </ResponsiveContainer>
      );
    }

    case "combo":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey={xAxis} tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            {renderTooltip()}
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            {yAxes.map((yKey, index) => {
              if (index === 0) {
                return <Bar key={yKey} dataKey={yKey} fill={colors[index % colors.length]} radius={[4, 4, 0, 0]} barSize={40} />;
              }
              return (
                <Line
                  key={yKey}
                  type="monotone"
                  dataKey={yKey}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2 }}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      );

    case "scatter": {
      const xMetricCol = block.dataset.columns.find(c => c.name === yAxes[0]);
      const yMetricCol = block.dataset.columns.find(c => c.name === yAxes[1]);
      const zDimCol = block.dataset.columns.find(c => c.name === xAxis);

      const scatterLegendPayload = data.map((entry, index) => ({
        id: String(entry[xAxis] ?? ""),
        type: 'circle' as const,
        value: String(entry[xAxis] ?? ""),
        color: colors[index % colors.length]
      }));

      return (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey={yAxes[0]} type="number" name={xMetricCol?.label || yAxes[0]} tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
            <YAxis dataKey={yAxes[1]} type="number" name={yMetricCol?.label || yAxes[1]} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <ZAxis dataKey={xAxis} type="category" name={zDimCol?.label || xAxis} />
            {renderTooltip()}
            <Legend wrapperStyle={{ fontSize: "12px" }} payload={scatterLegendPayload} />
            <Scatter name={block.visualization.title || "Données"} data={data} fill={colors[0]}>
              <LabelList dataKey={xAxis} position="top" style={{ fontSize: '10px', fill: '#64748b' }} />
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      );

    }
    case "radar":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey={xAxis} tick={{ fontSize: 12, fill: "#64748b" }} />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fontSize: 10 }} />
            {renderTooltip()}
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            {yAxes.map((yKey, index) => (
              <Radar
                key={yKey}
                name={yKey}
                dataKey={yKey}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.5}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      );

    case "treemap":
      return (
        <div className="w-full h-full flex flex-col">
          <ResponsiveContainer width="100%" height="100%" className="flex-1">
            <Treemap
              data={data}
              dataKey={yAxes[0]}
              nameKey={xAxis}
              stroke="#fff"
              content={<CustomizedTreemapContent colors={colors} />}
            >
              {renderTooltip()}
            </Treemap>
          </ResponsiveContainer>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-4 overflow-y-auto max-h-[80px]">
            {data.map((entry, index) => (
              <div key={`legend-${index}`} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                <span className="text-xs text-slate-600">{String(entry[xAxis] ?? "")}</span>
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return <div>Format graphique non supporté</div>;
  }
};
