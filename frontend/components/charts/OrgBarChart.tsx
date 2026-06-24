"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Props {
  data: { organizationName: string | null; _count: { id: number } }[];
  height?: number;
  loading?: boolean;
  error?: boolean;
}

export default function OrgBarChart({ data, height = 280, loading, error }: Props) {
  if (loading) return <div className="bg-gray-100 rounded animate-pulse" style={{ height }} />;
  if (error) return <div className="flex items-center justify-center text-sm text-red-500" style={{ height }}>Failed to load data</div>;

  const items = data
    .map((d) => ({ name: d.organizationName ?? "Unknown", value: d._count.id }))
    .slice(0, 10);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={items} layout="vertical" margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
        <Tooltip formatter={(v: number) => [v.toLocaleString(), "Issues"]} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {items.map((_, i) => (
            <Cell key={i} fill={i === 0 ? "#8B1A1A" : "#e5a0a0"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
