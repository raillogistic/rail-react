import * as React from "react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type Props = {
  type: "line" | "bar";
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKey: string;
  height?: number;
};

export default function ChartDetail({ type, data, xKey, yKey, height = 240 }: Props) {
  return (
    <div className="w-full h-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {type === "line" ? (
          <LineChart data={data as any} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey={yKey} stroke="#3b82f6" strokeWidth={2} dot={false} />
          </LineChart>
        ) : (
          <BarChart data={data as any} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Bar dataKey={yKey} fill="#22c55e" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

