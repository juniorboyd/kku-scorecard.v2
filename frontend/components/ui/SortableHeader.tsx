"use client";
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";

interface Props {
  label: string;
  field: string;
  currentSort: string;
  currentOrder: "asc" | "desc";
  onSort: (field: string) => void;
  align?: "left" | "right";
  className?: string;
}

export default function SortableHeader({
  label, field, currentSort, currentOrder, onSort, align = "left", className = "",
}: Props) {
  const active = currentSort === field;
  return (
    <th
      className={`py-3.5 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer select-none whitespace-nowrap hover:bg-slate-200/50 dark:hover:bg-slate-700/50 border-b border-slate-200 dark:border-slate-800 transition-colors ${align === "right" ? "text-right" : "text-left"} ${className}`}
      onClick={() => onSort(field)}
    >
      {label}
      {active
        ? currentOrder === "asc"
          ? <ArrowUp className="w-3 h-3 inline ml-1 text-blue-600" />
          : <ArrowDown className="w-3 h-3 inline ml-1 text-blue-600" />
        : <ChevronsUpDown className="w-3 h-3 inline ml-1 opacity-30" />}
    </th>
  );
}
