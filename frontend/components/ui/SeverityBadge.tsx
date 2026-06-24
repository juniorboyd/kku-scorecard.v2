const classes: Record<string, string> = {
  HIGH:   "badge-high",
  MEDIUM: "badge-medium",
  LOW:    "badge-low",
  INFO:   "badge-info",
};

export default function SeverityBadge({ severity }: { severity: string }) {
  const cls = classes[severity?.toUpperCase()] ?? "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600";
  return <span className={cls}>{severity?.toUpperCase() ?? "—"}</span>;
}
