"use client";
import React, { useState, useEffect } from "react";
import { X, Server, AlertTriangle, ShieldCheck, Loader2, TrendingUp } from "lucide-react";
import { useSnapshot } from "@/lib/snapshotContext";
import { issuesApi, domainsApi, orgsApi } from "@/lib/api";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import IssueDetailModal from "@/components/IssueDetailModal";

type Issue = { name: string; status: "pass" | "fail" | "warning"; detail: string };
type FacultyData = {
  id: string;
  name: string;
  nameEn: string;
  score: number;
  grade: string;
  issues: Issue[];
  assets?: string[];
};

export default function FacultyDetailModal({
  faculty,
  onClose,
}: {
  faculty: FacultyData;
  onClose: () => void;
}) {
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"issues" | "assets" | "history">("issues");
  const { selectedSnapshotId } = useSnapshot();

  const [issues, setIssues] = useState<any[]>([]);
  const [assets, setAssets] = useState<string[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!selectedSnapshotId) return;

    setLoadingIssues(true);
    issuesApi.getIssues({
      snapshotId: selectedSnapshotId,
      organizations: [faculty.name],
      pageSize: 1000,
    })
      .then((res) => {
        setIssues(res.data?.items ?? []);
      })
      .catch((err) => {
        console.error("Error fetching issues:", err);
      })
      .finally(() => {
        setLoadingIssues(false);
      });

    setLoadingAssets(true);
    domainsApi.list({
      snapshotId: selectedSnapshotId,
      organizations: [faculty.name],
      pageSize: 1000,
    })
      .then((res) => {
        const assetList = (res.data?.items ?? res.items ?? []).map((item: any) => item.domain);
        setAssets(assetList);
      })
      .catch((err) => {
        console.error("Error fetching assets:", err);
      })
      .finally(() => {
        setLoadingAssets(false);
      });
  }, [faculty.name, selectedSnapshotId]);

  useEffect(() => {
    if (faculty.id && !isNaN(Number(faculty.id))) {
      setLoadingHistory(true);
      orgsApi.getHistory(Number(faculty.id))
        .then((res) => {
          const historyList = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
          const formatted = historyList.map((d: any) => ({
            date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
            score: d.securityScore,
          }));
          setHistoryData(formatted);
        })
        .catch((err) => {
          console.error("Error fetching score history:", err);
          setHistoryData([]);
        })
        .finally(() => {
          setLoadingHistory(false);
        });
    } else {
      setLoadingHistory(false);
      setHistoryData([]);
    }
  }, [faculty.id]);

  const gradientId =
    faculty.score >= 80 ? "gauge-green" :
    faculty.score >= 60 ? "gauge-orange" :
    "gauge-red";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute -inset-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm" />
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 dark:border-slate-800">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{faculty.name}</h2>
            {faculty.nameEn && faculty.nameEn !== faculty.name && (
              <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 mt-0.5">{faculty.nameEn}</p>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div className="relative flex flex-col items-center justify-center w-[160px] h-[95px] -mt-1 select-none">
              <svg width="140" height="85" viewBox="0 0 160 95" className="overflow-visible">
                <defs>
                  <linearGradient id="gauge-green" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#34D399" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="gauge-orange" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#EA580C" />
                  </linearGradient>
                  <linearGradient id="gauge-red" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#EF4444" />
                    <stop offset="100%" stopColor="#991B1B" />
                  </linearGradient>
                </defs>
                <path
                  d="M 20 85 A 60 60 0 0 1 140 85"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  d="M 20 85 A 60 60 0 0 1 140 85"
                  fill="none"
                  stroke={`url(#${gradientId})`}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray="188.5"
                  strokeDashoffset={188.5 - (188.5 * (Math.max(0, Math.min(100, faculty.score)) / 100))}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute top-[48px] flex flex-col items-center">
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">
                  {faculty.score.toFixed(1)}
                </span>
                <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                  GRADE {faculty.grade}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ml-2">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Main Panel: Details */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 py-4 gap-2 bg-slate-50/50 dark:bg-slate-900/50">
              <button
                onClick={() => setActiveTab("issues")}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-extrabold rounded-xl transition-all duration-200 ${
                  activeTab === "issues"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-850"
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                รายการปัญหาที่พบ
              </button>
              <button
                onClick={() => setActiveTab("assets")}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-extrabold rounded-xl transition-all duration-200 ${
                  activeTab === "assets"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-850"
                }`}
              >
                <Server className="w-4 h-4" />
                สินทรัพย์
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-extrabold rounded-xl transition-all duration-200 ${
                  activeTab === "history"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-850"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                ประวัติคะแนน
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900">
              {activeTab === "issues" ? (
                <div className="space-y-4">
                  <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                    <strong>💡 วิธีการคำนวณคะแนน:</strong> ระบบใช้สมการ Exponential Decay <code className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 py-0.5 rounded mx-1">100 × e^(-ผลรวมแต้มลดทอน/150)</code> เพื่อลดทอนคะแนนอย่างสมดุล (ไม่ใช่การนำแต้มมาลบออกจาก 100 โดยตรง)
                  </div>
                  {loadingIssues ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                      <p className="text-sm font-medium text-slate-500">กำลังโหลดรายการปัญหา...</p>
                    </div>
                  ) : issues.length > 0 ? issues.map((issue: any, idx: number) => {
                    const sev = (issue.severity ?? "").toUpperCase();
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedIssue(issue)}
                        className="flex gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300 dark:hover:border-blue-700"
                      >
                        <div className="mt-0.5 shrink-0">
                          {sev === "LOW" || sev === "INFO" ? (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400"><ShieldCheck className="w-4 h-4" /></div>
                          ) : sev === "MEDIUM" ? (
                            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400"><AlertTriangle className="w-4 h-4" /></div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400"><AlertTriangle className="w-4 h-4" /></div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{issue.issueTypeTitle || issue.title || issue.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{issue.finalUrl || issue.host || issue.desc || issue.detail}</p>
                          {issue.scoreImpact !== undefined && (
                            <p className="text-[10px] text-red-500 font-bold mt-1">แต้มลดทอน (Impact): {issue.scoreImpact.toFixed(3)}</p>
                          )}
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
                      <ShieldCheck className="w-12 h-12 text-emerald-500 mb-4" />
                      <p className="text-sm font-medium text-slate-500">ไม่พบปัญหาความปลอดภัยในระบบ</p>
                    </div>
                  )}
                </div>
              ) : activeTab === "assets" ? (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    รายชื่อสินทรัพย์และโดเมนระบบงาน ({assets.length})
                  </div>
                  {loadingAssets ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                      <p className="text-sm font-medium text-slate-500">กำลังโหลดสินทรัพย์...</p>
                    </div>
                  ) : assets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {assets.map((asset: string, idx: number) => {
                        const href = asset.startsWith("http") ? asset : `https://${asset}`;
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                <Server className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-mono font-semibold text-slate-700 dark:text-slate-200 truncate select-all">
                                {asset}
                              </span>
                            </div>
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline shrink-0 ml-2"
                            >
                              เปิดเว็บ &rarr;
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                      <Server className="w-12 h-12 text-slate-300 mb-4" />
                      <p className="text-sm font-medium text-slate-500">ไม่พบข้อมูลสินทรัพย์และโดเมนในระบบ</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    ประวัติคะแนนความปลอดภัยย้อนหลัง
                  </div>
                  {loadingHistory ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                      <p className="text-sm font-medium text-slate-500">กำลังโหลดประวัติคะแนน...</p>
                    </div>
                  ) : historyData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                      <TrendingUp className="w-12 h-12 text-slate-300 mb-4" />
                      <p className="text-sm font-medium text-slate-500">ไม่มีข้อมูลประวัติคะแนนในระบบ</p>
                    </div>
                  ) : (
                    <div className="h-72 w-full pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="date" tickLine={false} style={{ fontSize: 12, fill: "#64748B" }} />
                          <YAxis domain={[0, 100]} tickLine={false} axisLine={false} style={{ fontSize: 12, fill: "#64748B" }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1E293B",
                              border: "none",
                              borderRadius: "0.5rem",
                              color: "#F8FAFC",
                            }}
                            labelStyle={{ fontWeight: "bold" }}
                          />
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="#3B82F6"
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
        />
      )}
    </div>
  );
}
