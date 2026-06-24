"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Props {
  data: any[];
  lines: { key: string; color: string; name?: string }[];
  xKey?: string;
  height?: number;
  loading?: boolean;
  error?: boolean;
}

export default function TrendLineChart({ data, lines, xKey = "date", height = 280, loading, error }: Props) {
  const fmt = (v: string) => {
    try { return new Date(v).toLocaleDateString("en-GB", { month: "short", day: "numeric" }); }
    catch { return v; }
  };

  if (loading) return <div className="bg-gray-100 rounded animate-pulse" style={{ height }} />;
  if (error) return <div className="flex items-center justify-center text-sm text-red-500" style={{ height }}>Failed to load data</div>;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey={xKey} tickFormatter={fmt} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip labelFormatter={fmt} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {lines.map((l) => (
          <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} name={l.name ?? l.key}
            strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
