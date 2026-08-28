"use client";

import { useEffect, useState, useCallback } from "react";
import { useSnapshot } from "@/lib/snapshotContext";
import { dashboardApi } from "@/lib/api";
import { Search, ArrowRight, TrendingUp, AlertTriangle, Shield, CheckCircle, RefreshCw } from "lucide-react";

export default function ComparisonPage() {
  const { snapshots, loading: snapshotsLoading } = useSnapshot();
  const [idA, setIdA] = useState<number | "">("");
  const [idB, setIdB] = useState<number | "">("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "scoreA" | "scoreB" | "delta">("delta");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc"); // Default asc to show biggest drops first

  // Set default snapshot selections once list is loaded
  useEffect(() => {
    if (snapshots.length >= 2) {
      setIdA(snapshots[1].id); // Older snapshot
      setIdB(snapshots[0].id); // Newer snapshot
    } else if (snapshots.length === 1) {
      setIdA(snapshots[0].id);
      setIdB(snapshots[0].id);
    }
  }, [snapshots]);

  const fetchComparison = useCallback(async () => {
    if (!idA || !idB) return;
    setLoading(true);
    setError(false);
    try {
      const res = await dashboardApi.compareSnapshots(Number(idA), Number(idB));
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [idA, idB]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  const getUnivGrade = (s: number) => {
    if (s >= 90) return { label: "A", color: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30" };
    if (s >= 80) return { label: "B", color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30" };
    if (s >= 70) return { label: "C", color: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30" };
    if (s >= 60) return { label: "D", color: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30" };
    return { label: "F", color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30" };
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter & Sort organization comparison data
  const filteredOrgs = (data?.orgComparisons ?? []).filter((org: any) =>
    org.name.toLowerCase().includes(search.toLowerCase())
  );

  const sortedOrgs = [...filteredOrgs].sort((a: any, b: any) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    if (typeof valA === "string") {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder(field === "delta" || field === "name" ? "asc" : "desc");
    }
  };

  const renderDeltaBadge = (delta: number, isReversed = false) => {
    const isPositive = delta > 0;
    const isNegative = delta < 0;
    
    // For scores: positive is good (+), negative is bad (-)
    // For issues: positive is bad (+ issues), negative is good (- issues)
    const isGood = isReversed ? isNegative : isPositive;
    const isBad = isReversed ? isPositive : isNegative;

    if (delta === 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400">
          คงเดิม (0.0)
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
          isGood
            ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
            : isBad
            ? "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
            : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400"
        }`}
      >
        {delta > 0 ? `+${delta}` : delta}
      </span>
    );
  };

  const isLoading = loading || snapshotsLoading;

  return (
    <div className="space-y-6">
      {/* Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">เปรียบเทียบแนวโน้มข้อมูล</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500">เปรียบเทียบคะแนนและสถิติช่องโหว่ระหว่าง Snapshot สองช่วงเวลา</p>
        </div>
        
        {/* Selector Panel */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl shadow-sm">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ข้อมูลเปรียบเทียบ (A)</label>
            <select
              value={idA}
              onChange={(e) => setIdA(e.target.value ? Number(e.target.value) : "")}
              className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="" disabled>เลือก Snapshot A</option>
              {snapshots.map((s) => (
                <option key={s.id} value={s.id} disabled={s.id === Number(idB)}>
                  {formatDate(s.snapshotDate)} (Issues: {s.totalIssues})
                </option>
              ))}
            </select>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-400 mx-2 self-end mb-2" />

          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ข้อมูลปัจจุบัน (B)</label>
            <select
              value={idB}
              onChange={(e) => setIdB(e.target.value ? Number(e.target.value) : "")}
              className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="" disabled>เลือก Snapshot B</option>
              {snapshots.map((s) => (
                <option key={s.id} value={s.id} disabled={s.id === Number(idA)}>
                  {formatDate(s.snapshotDate)} (Issues: {s.totalIssues})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">ล้มเหลวในการดึงข้อมูลเปรียบเทียบ กรุณาลองใหม่อีกครั้ง</p>
          <button onClick={fetchComparison} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
            ลองใหม่
          </button>
        </div>
      )}

      {/* Comparison KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score KPI */}
        <div className="card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-400">University Score</p>
              {isLoading ? (
                <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mt-2" />
              ) : (
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-slate-800 dark:text-white">
                    {data?.snapshotB?.score ?? "—"}
                  </span>
                  <span className="text-xs text-slate-400">
                    จากเดิม {data?.snapshotA?.score ?? "—"}
                  </span>
                </div>
              )}
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-500">
              <Shield className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">การเปลี่ยนแปลง:</span>
            {isLoading ? (
              <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            ) : (
              renderDeltaBadge(data?.deltas?.score ?? 0, false)
            )}
          </div>
        </div>

        {/* Total Issues KPI */}
        <div className="card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-400">รายการปัญหาทั้งหมด (Total Issues)</p>
              {isLoading ? (
                <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mt-2" />
              ) : (
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-slate-800 dark:text-white">
                    {(data?.snapshotB?.totalIssues ?? 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400">
                    จากเดิม {(data?.snapshotA?.totalIssues ?? 0).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-xl text-orange-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">การเปลี่ยนแปลง:</span>
            {isLoading ? (
              <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            ) : (
              renderDeltaBadge(data?.deltas?.totalIssues ?? 0, true) // reversed: decrease is good
            )}
          </div>
        </div>

        {/* High Severity KPI */}
        <div className="card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-slate-400">ระดับความรุนแรงสูง (High Severity)</p>
              {isLoading ? (
                <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mt-2" />
              ) : (
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-slate-800 dark:text-white">
                    {(data?.snapshotB?.highCount ?? 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400">
                    จากเดิม {(data?.snapshotA?.highCount ?? 0).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl text-red-500">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">การเปลี่ยนแปลง:</span>
            {isLoading ? (
              <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            ) : (
              renderDeltaBadge(data?.deltas?.highCount ?? 0, true) // reversed: decrease is good
            )}
          </div>
        </div>
      </div>

      {/* Organization Comparisons Table */}
      <div className="card">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-white">เปรียบเทียบคะแนนรายหน่วยงาน / คณะ</h2>
          
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อหน่วยงาน..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-850 text-xs font-bold text-slate-450 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 select-none">
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100/55 dark:hover:bg-slate-800/40" onClick={() => handleSort("name")}>
                  หน่วยงาน {sortBy === "name" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100/55 dark:hover:bg-slate-800/40 text-center" onClick={() => handleSort("scoreA")}>
                  คะแนนเดิม (A) {sortBy === "scoreA" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100/55 dark:hover:bg-slate-800/40 text-center" onClick={() => handleSort("scoreB")}>
                  คะแนนใหม่ (B) {sortBy === "scoreB" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100/55 dark:hover:bg-slate-800/40 text-center" onClick={() => handleSort("delta")}>
                  ส่วนต่าง (Delta) {sortBy === "delta" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4"><div className="h-4 w-48 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /></td>
                    <td className="px-6 py-4 text-center"><div className="h-4 w-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><div className="h-4 w-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><div className="h-5 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mx-auto" /></td>
                  </tr>
                ))
              ) : sortedOrgs.length > 0 ? (
                sortedOrgs.map((org: any) => {
                  const gradeA = getUnivGrade(org.scoreA);
                  const gradeB = getUnivGrade(org.scoreB);

                  return (
                    <tr key={org.organizationId} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                        {org.name}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-extrabold text-slate-700 dark:text-slate-300">{org.scoreA.toFixed(1)}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${gradeA.color}`}>{gradeA.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-extrabold text-slate-700 dark:text-slate-300">{org.scoreB.toFixed(1)}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${gradeB.color}`}>{gradeB.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {renderDeltaBadge(org.delta, false)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm font-semibold text-slate-400">
                    ไม่พบข้อมูลที่ค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
