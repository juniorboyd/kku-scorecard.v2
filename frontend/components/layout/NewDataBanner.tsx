"use client";
import { usePathname } from "next/navigation";
import { RefreshCw, X } from "lucide-react";
import { useSnapshot } from "@/lib/snapshotContext";

/**
 * Shown on data pages when a new import has completed. Clicking "อัปเดต"
 * switches to the newest snapshot, which makes each page refetch its data via
 * its existing selectedSnapshotId effect — no full page reload.
 * Hidden on /imports, which refreshes its own list.
 */
export default function NewDataBanner() {
  const path = usePathname();
  const { hasNewData, applyNewData, dismissNewData } = useSnapshot();

  if (!hasNewData || path.startsWith("/imports")) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 mb-4">
      <p className="text-sm font-medium text-blue-800">New data available — click to update</p>
      <div className="flex items-center gap-1">
        <button
          onClick={applyNewData}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Update
        </button>
        <button
          onClick={dismissNewData}
          className="p-1.5 text-blue-400 hover:text-blue-700 rounded-lg transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
