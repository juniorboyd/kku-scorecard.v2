"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/ui/StatusBadge";
import Pagination from "@/components/ui/Pagination";
import SortableHeader from "@/components/ui/SortableHeader";
import { logsApi } from "@/lib/api";
import { useRole } from "@/lib/me";

const PAGE_SIZE = 20;

export default function LogsPage() {
  const router = useRouter();
  const role = useRole();
  // System Logs are ADMIN/ANALYST only — VIEWER is bounced to the dashboard.
  const canView = role === "ADMIN" || role === "ANALYST";

  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (role && !canView) router.replace("/dashboard");
  }, [role, canView, router]);

  const load = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    try {
      const r = await logsApi.list({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE, status: statusFilter || undefined, sortBy, sortOrder });
      setData(r);
    } finally { setLoading(false); }
  }, [page, statusFilter, sortBy, sortOrder, canView]);

  useEffect(() => { load(); }, [load]);

  // Avoid flashing the logs table while the redirect is in flight.
  if (role && !canView) return null;

  function handleSort(field: string) {
    if (field === sortBy) { setSortOrder((o) => o === "asc" ? "desc" : "asc"); }
    else { setSortBy(field); setSortOrder(field === "createdAt" ? "desc" : "asc"); }
    setPage(1);
  }

  const items: any[] = data?.items ?? [];
  const total: number = data?.total ?? 0;

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="card p-4 flex gap-3 items-center">
        <select className="input w-40" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILED">Failed</option>
          <option value="WARNING">Warning</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">No.</th>
                <SortableHeader label="User"     field="user"      currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Role"     field="role"      currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Action"   field="action"    currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Status"   field="status"    currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Datetime" field="createdAt" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No logs found</td></tr>
              ) : (
                items.map((log: any, i: number) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400 text-xs">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="px-4 py-3 text-gray-700 text-xs">
                      {log.user ? `${log.user.firstName ?? ""} ${log.user.lastName ?? ""}`.trim() || log.user.email : "System"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{log.user?.role ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-700 font-mono text-xs">{log.action}</td>
                    <td className="px-4 py-3"><StatusBadge status={log.status} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(log.createdAt).toLocaleString("en-GB")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 border-t border-gray-100">
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}
