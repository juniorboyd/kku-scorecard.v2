"use client";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS: Record<string, string> = {
  HIGH:   "#EF4444",
  MEDIUM: "#F97316",
  LOW:    "#EAB308",
  INFO:   "#38BDF8",
};
const ORDER = ["HIGH", "MEDIUM", "LOW", "INFO"];

interface Props { data: { severity: string; _count: { id: number } }[]; height?: number; loading?: boolean; error?: boolean; }

export default function SeverityPieChart({ data, height = 280, loading, error }: Props) {
  if (loading) return <div className="bg-gray-100 rounded animate-pulse" style={{ height }} />;
  if (error) return <div className="flex items-center justify-center text-sm text-red-500" style={{ height }}>Failed to load data</div>;

  const sorted = ORDER.map((sev) => {
    const item = data.find((d) => d.severity?.toUpperCase() === sev);
    return { name: sev, value: item?._count?.id ?? 0 };
  }).filter((d) => d.value > 0);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={sorted} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) =>
          `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
          {sorted.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name] ?? "#94a3b8"} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => [v.toLocaleString(), "Issues"]} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
