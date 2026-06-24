import type { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  color?: "default" | "red" | "orange" | "yellow" | "green" | "blue";
  loading?: boolean;
  /** Change vs the previous snapshot. Omit/null hides the badge; 0 shows a neutral badge. */
  delta?: number | null;
  /** Reverse delta colors (e.g. Score: an increase is good → green). */
  deltaReversed?: boolean;
  /** ISO date of the snapshot being compared against; shown in the badge tooltip. */
  deltaDate?: string;
}

const colorMap = {
  default: "bg-gray-50 text-gray-600",
  red: "bg-red-50 text-red-600",
  orange: "bg-orange-50 text-orange-600",
  yellow: "bg-yellow-50 text-yellow-600",
  green: "bg-green-50 text-green-600",
  blue: "bg-sky-50 text-sky-600",
};

function DeltaBadge({ delta, reversed, date }: { delta: number; reversed?: boolean; date?: string }) {
  const up = delta > 0;
  const down = delta < 0;
  const arrow = up ? "▲" : down ? "▼" : "—";
  const color = up
    ? (reversed ? "text-green-600" : "text-red-600")
    : down
      ? (reversed ? "text-red-600" : "text-green-600")
      : "text-gray-400";
  const sign = up ? "+" : ""; // negatives already carry "-"
  const tooltip = date ? `vs ${new Date(date).toLocaleDateString("en-GB")}` : undefined;
  return (
    <span className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${color}`} title={tooltip}>
      <span>{arrow}</span>
      <span>{sign}{delta}</span>
    </span>
  );
}

export default function KpiCard({ title, value, sub, icon: Icon, color = "default", loading, delta, deltaReversed, deltaDate }: Props) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 font-medium truncate">{title}</p>
          {loading ? (
            <div className="mt-2 h-8 w-24 bg-gray-200 rounded animate-pulse" />
          ) : (
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          )}
          {!loading && delta != null && (
            <div><DeltaBadge delta={delta} reversed={deltaReversed} date={deltaDate} /></div>
          )}
          {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        </div>
        {Icon && (
          <div className={`flex-shrink-0 ml-3 w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
