"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Shield, BarChart2, TrendingUp, HelpCircle, UploadCloud, RefreshCw, ShieldCheck } from "lucide-react";
import KpiCard from "@/components/ui/KpiCard";
import TrendLineChart from "@/components/charts/TrendLineChart";
import SeverityPieChart from "@/components/charts/SeverityPieChart";
import OrgBarChart from "@/components/charts/OrgBarChart";
import { dashboardApi } from "@/lib/api";
import { useSnapshot } from "@/lib/snapshotContext";
import dynamic from "next/dynamic";
import { SECURITY_MOCK_DATA } from "@/lib/mock-data";
import FacultyDetailModal from "@/components/FacultyDetailModal";

const CampusMap = dynamic(() => import("@/components/CampusMap"), { ssr: false });

const FORMULAS = [
  {
    lhs: "SCORE_PER_ISSUE",
    rhs: "ISSUE_TYPE_SCORE_IMPACT  ÷  TOTAL_ISSUES_OF_THAT_TYPE",
    desc: "คะแนนหักต่อ issue = ผลกระทบของประเภท issue นั้น หารด้วยจำนวน issue ประเภทนั้นทั้งมหาวิทยาลัย",
  },
  {
    lhs: "ORG_DEDUCTION",
    rhs: "Σ SCORE_PER_ISSUE  (เฉพาะ issue ของ org นั้น)",
    desc: "คะแนนที่คณะหักออก = ผลรวม SCORE_PER_ISSUE ของทุก issue ที่คณะนั้นตรวจพบ",
  },
  {
    lhs: "TOTAL_DEDUCTION",
    rhs: "Σ SCORE_PER_ISSUE  (ทุก issue ทั้งมหาวิทยาลัย)",
    desc: "คะแนนหักรวมทั้งมหาวิทยาลัย = ผลรวม SCORE_PER_ISSUE ของทุก issue",
  },
  {
    lhs: "RISK_SHARE",
    rhs: "ORG_DEDUCTION  ÷  TOTAL_DEDUCTION",
    desc: "สัดส่วนความเสี่ยงของคณะ = คะแนนหักของคณะ หารด้วยคะแนนหักทั้งมหาวิทยาลัย",
  },
  {
    lhs: "ORG_SCORE",
    rhs: "100  −  (RISK_SHARE  ×  TOTAL_DEDUCTION)",
    desc: "คะแนนของคณะ = 100 ลบด้วยคะแนนที่คณะนั้นรับผิดชอบ",
  },
  {
    lhs: "UNIVERSITY_SCORE",
    rhs: "100  −  TOTAL_DEDUCTION",
    desc: "คะแนนมหาวิทยาลัย = 100 ลบด้วยคะแนนหักทั้งหมด",
  },
];

function getGrade(score: number) {
  if (score >= 90) return { label: "A", badge: "text-green-700 bg-green-100", bar: "bg-green-500" };
  if (score >= 80) return { label: "B", badge: "text-emerald-700 bg-emerald-100", bar: "bg-emerald-400" };
  if (score >= 70) return { label: "C", badge: "text-yellow-700 bg-yellow-100", bar: "bg-yellow-400" };
  if (score >= 60) return { label: "D", badge: "text-orange-700 bg-orange-100", bar: "bg-orange-400" };
  return { label: "F", badge: "text-red-700 bg-red-100", bar: "bg-red-500" };
}

export default function DashboardPage() {
  const [selectedFaculty, setSelectedFaculty] = useState<any>(null);
  const router = useRouter();
  const { selectedSnapshotId, snapshots, loading: snapshotsLoading } = useSnapshot();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [orgScores, setOrgScores] = useState<any[]>([]);
  const [orgScoresLoading, setOrgScoresLoading] = useState(true);

  const load = useCallback(() => {
    if (selectedSnapshotId === null) return;
    setLoading(true);
    setError(false);
    dashboardApi
      .getOverview({ snapshotId: selectedSnapshotId })
      .then((r) => setData(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));

    setOrgScoresLoading(true);
    dashboardApi
      .getOrgScores(selectedSnapshotId)
      .then((r) => setOrgScores(r.data ?? []))
      .catch(() => setOrgScores([]))
      .finally(() => setOrgScoresLoading(false));
  }, [selectedSnapshotId]);

  useEffect(() => { load(); }, [load]);

  const stat = data?.latestStat;
  const score = data?.scoreHistory?.at(-1)?.score ?? "—";
  const totalIssues = stat?.totalIssues ?? 0;
  const highCount = stat?.highCount ?? 0;
  const deltas = data?.deltas as { totalIssues: number; highCount: number; score: number; previousDate: string } | null | undefined;

  function getUnivGrade(s: number) {
    if (s >= 90) return { label: "A", color: "text-green-600" };
    if (s >= 80) return { label: "B", color: "text-blue-600" };
    if (s >= 70) return { label: "C", color: "text-yellow-600" };
    if (s >= 60) return { label: "D", color: "text-orange-600" };
    return { label: "F", color: "text-red-600" };
  }
  const grade = typeof score === "number" ? getUnivGrade(score) : { label: "—", color: "text-gray-400" };

  const trendData = (data?.dailyTrend ?? []).map((d: any) => ({
    date: d.date,
    Total: d.totalIssues,
    High: d.highCount,
    Medium: d.mediumCount,
  }));

  // Loading covers both the snapshot list fetch and the dashboard data fetch.
  const isLoading = loading || snapshotsLoading;

  // We disabled the empty state return to allow mock data to show.
  // if (!snapshotsLoading && snapshots.length === 0) { ... }

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">Failed to load data. Please try again</p>
          <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="University Score" value={score} sub="SecurityScorecard" icon={Shield} color="blue" loading={isLoading}
          delta={deltas?.score} deltaReversed deltaDate={deltas?.previousDate} />
        <KpiCard title="University Grade" value={grade.label} icon={TrendingUp} color="green" loading={isLoading} />
        <KpiCard title="Total Issues" value={totalIssues.toLocaleString()} icon={AlertTriangle} color="orange" loading={isLoading}
          delta={deltas?.totalIssues} deltaDate={deltas?.previousDate} />
        <KpiCard title="High Severity" value={highCount.toLocaleString()} icon={BarChart2} color="red" loading={isLoading}
          delta={deltas?.highCount} deltaDate={deltas?.previousDate} />
      </div>

      {/* Campus Map Section */}
      <div className="card p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Khon Kaen University Campus Map</h3>
          <span className="text-xs text-gray-500 font-medium">Risk Distribution across faculties</span>
        </div>
        <CampusMap orgScores={orgScores} onMarkerClick={(f) => setSelectedFaculty(f)} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="mb-4">Security Score Trend</h3>
          <TrendLineChart
            data={(data?.scoreHistory ?? []).map((d: any) => ({ date: d.date, Score: d.score }))}
            lines={[{ key: "Score", color: "#8B1A1A", name: "Score" }]}
            loading={isLoading}
            error={error}
          />
        </div>
        <div className="card p-5">
          <h3 className="mb-4">Severity Distribution</h3>
          <SeverityPieChart data={data?.severityBreakdown ?? []} loading={isLoading} error={error} />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="mb-4">Issues Trend (Monthly)</h3>
          <TrendLineChart
            data={trendData}
            lines={[
              { key: "Total", color: "#6b7280" },
              { key: "High", color: "#EF4444" },
              { key: "Medium", color: "#F97316" },
            ]}
            loading={isLoading}
            error={error}
          />
        </div>
        <div className="card p-5">
          <h3 className="mb-4">Top Organizations by Issues</h3>
          <OrgBarChart data={data?.topOrganizations ?? []} loading={isLoading} error={error} />
        </div>
      </div>

      {/* Bottom Row — Top Domains + Top Issue Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="mb-4">Top 5 Vulnerable Domains</h3>
          <div className="space-y-2">
            {(data?.topDomains ?? []).slice(0, 5).map((d: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{d.host}</p>
                  <p className="text-xs text-gray-400">{d.organization || "—"}</p>
                </div>
                <span className="text-sm font-semibold text-red-600">{d.totalIssues}</span>
              </div>
            ))}
            {!loading && !(data?.topDomains?.length) && <p className="text-sm text-gray-400">No data</p>}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-4">Top Issue Types</h3>
          <div className="space-y-2">
            {(data?.topIssueTypes ?? []).slice(0, 5).map((t: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <p className="text-sm text-gray-900 truncate max-w-xs">{t.issueTypeTitle}</p>
                <span className="text-sm font-semibold text-gray-700">{t._count.id.toLocaleString()}</span>
              </div>
            ))}
            {!loading && !(data?.topIssueTypes?.length) && <p className="text-sm text-gray-400">No data</p>}
          </div>
        </div>
      </div>

      {/* Org Risk Score Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

        {/* Left — Formula Card */}
        <div className="card p-5 border-l-4 border-brand-800">
          <h3 className="mb-1 text-brand-800">สูตรคำนวณคะแนน</h3>
          <p className="text-xs text-gray-500 mb-4">Score Calculation Formula</p>
          <div className="space-y-3">
            {FORMULAS.map((f, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex flex-wrap items-baseline gap-x-2 font-mono text-xs">
                  <span className="text-brand-800 font-semibold whitespace-nowrap">{f.lhs}</span>
                  <span className="text-gray-400">=</span>
                  <span className="text-gray-800 whitespace-nowrap">{f.rhs}</span>
                </div>
                <p className="text-xs text-gray-500 pl-2 border-l-2 border-gray-200">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Org Score Table */}
        {(() => {
          const UNKNOWN_KEYS = new Set(["unknown", "no data"]);
          let knownOrgs = orgScores.filter((o) => !UNKNOWN_KEYS.has(o.organization ?? ""));
          const unknownOrg = orgScores.find((o) => UNKNOWN_KEYS.has(o.organization ?? ""));

          if (!orgScoresLoading && knownOrgs.length === 0) {
            // Use mock data fallback
            knownOrgs = SECURITY_MOCK_DATA.faculties.map(f => ({
              organization: f.name,
              securityScore: f.score
            })).sort((a, b) => a.securityScore - b.securityScore);
          }

          return (
            <div className="card p-5 flex flex-col">
              <h3 className="mb-1">Organization Risk Score</h3>
              <p className="text-xs text-gray-500 mb-3">sorted by score ascending (most risky first)</p>

              {/* Scrollable known-orgs table */}
              <div className="overflow-y-auto" style={{ maxHeight: "480px" }}>
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-gray-200">
                      <th className="text-left pb-2 text-xs font-semibold text-gray-500 uppercase w-6">#</th>
                      <th className="text-left pb-2 text-xs font-semibold text-gray-500 uppercase">Organization</th>
                      <th className="text-right pb-2 text-xs font-semibold text-gray-500 uppercase w-16">Score</th>
                      <th className="text-center pb-2 text-xs font-semibold text-gray-500 uppercase w-12">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orgScoresLoading ? (
                      Array.from({ length: 10 }).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={4} className="py-2">
                            <div className="h-4 bg-gray-100 rounded animate-pulse" />
                          </td>
                        </tr>
                      ))
                    ) : knownOrgs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-gray-400 text-sm">No data</td>
                      </tr>
                    ) : (
                      knownOrgs.map((row: any, i: number) => {
                        const g = getGrade(row.securityScore);
                        // Try to find the faculty in mock data to pass its full context
                        const mockFaculty = SECURITY_MOCK_DATA.faculties.find(f => f.name === row.organization || f.nameEn === row.organization);
                        return (
                          <tr key={i} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedFaculty(mockFaculty || { name: row.organization, score: row.securityScore, grade: g.label, issues: [], abbr: 'UN', nameEn: '' })}>
                            <td className="py-2 pr-2 text-xs text-gray-400">{i + 1}</td>
                            <td className="py-2 pr-3">
                              <p className="text-xs font-medium text-gray-800 truncate max-w-[220px]">{row.organization}</p>
                              <div className="mt-1 w-full bg-gray-100 rounded-full h-1">
                                <div className={`h-1 rounded-full ${g.bar}`} style={{ width: `${row.securityScore}%` }} />
                              </div>
                            </td>
                            <td className="py-2 text-right font-mono text-xs font-semibold text-gray-700">
                              {row.securityScore.toFixed(1)}
                            </td>
                            <td className="py-2 text-center">
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${g.badge}`}>{g.label}</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pinned unknown row — always below scroll area */}
              {unknownOrg && (() => {
                const g = getGrade(unknownOrg.securityScore);
                return (
                  <>
                    <div className="border-t-2 border-dashed border-gray-200 mt-1" />
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push("/assets?orgAssignment=unassigned")}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push("/assets?orgAssignment=unassigned"); } }}
                      className="flex items-center gap-2 py-2 px-1 bg-gray-50 rounded-b -mx-0 mt-0 cursor-pointer hover:bg-gray-100 transition-colors"
                      title="Unassigned assets — review in Assets page"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-400 italic">Unknown / Unassigned</p>
                        <div className="mt-1 w-full bg-gray-100 rounded-full h-1">
                          <div className={`h-1 rounded-full ${g.bar}`} style={{ width: `${unknownOrg.securityScore}%` }} />
                        </div>
                      </div>
                      <span className="font-mono text-xs font-semibold text-gray-500 w-16 text-right shrink-0">
                        {unknownOrg.securityScore.toFixed(1)}
                      </span>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded w-10 text-center shrink-0 ${g.badge}`}>
                        {g.label}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
          );
        })()}
      </div>

      {/* Recommendations Section */}
      <div className="card p-6 border-t-4 border-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800">
        <h3 className="mb-4 text-blue-900 dark:text-blue-400 font-extrabold flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" /> ข้อเสนอแนะเชิงนโยบายระดับมหาวิทยาลัย
        </h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1.5 rounded-lg shrink-0 mt-0.5"><AlertTriangle className="w-4 h-4" /></div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">บังคับใช้นโยบาย EDR แก่ทุกส่วนงาน</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">พบว่ายังมีหลายคณะ/หน่วยงานที่ติดตั้ง KKU-EDR ไม่ครอบคลุมสินทรัพย์ทั้งหมด ควรผลักดันเป็นนโยบายระดับมหาวิทยาลัยเพื่อป้องกัน Ransomware</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 p-1.5 rounded-lg shrink-0 mt-0.5"><AlertTriangle className="w-4 h-4" /></div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">ปรับปรุงระบบยืนยันตัวตน WiFi (SSO Integration)</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">ยกระดับมาตรฐาน WPA3-Enterprise และบังคับใช้ Multi-Factor Authentication (MFA) กับผู้ใช้สิทธิ์ระดับบุคลากร</p>
            </div>
          </li>
        </ul>
      </div>

      {selectedFaculty && (
        <FacultyDetailModal faculty={selectedFaculty} onClose={() => setSelectedFaculty(null)} />
      )}
    </div>
  );
}
