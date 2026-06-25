"use client";
import React, { useState } from "react";
import { X, Server, AlertTriangle, ShieldCheck } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"issues" | "assets">("issues");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{faculty.name}</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{faculty.nameEn}</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                faculty.grade === "A" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                faculty.grade === "B" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                faculty.grade === "C" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                faculty.grade === "D" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}>GRADE {faculty.grade}</span>
              
              <div className="text-right border-l border-slate-200 dark:border-slate-700 pl-4">
                <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{faculty.score.toFixed(1)}</div>
                <div className="text-xs font-bold text-slate-400">SCORE</div>
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
            <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 pt-4 gap-6 bg-white dark:bg-slate-900">
              <button
                onClick={() => setActiveTab("issues")}
                className={`pb-3 text-sm font-bold transition-colors border-b-2 ${
                  activeTab === "issues" ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400" : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  รายการปัญหาที่พบ
                </div>
              </button>
              <button
                onClick={() => setActiveTab("assets")}
                className={`pb-3 text-sm font-bold transition-colors border-b-2 ${
                  activeTab === "assets" ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400" : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  สินทรัพย์และโดเมน
                </div>
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900">
              {activeTab === "issues" ? (
                <div className="space-y-4">
                  {faculty.issues.length > 0 ? faculty.issues.map((issue: any, idx: number) => (
                    <div key={idx} className="flex gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:shadow-md transition-shadow">
                      <div className="mt-0.5 shrink-0">
                        {issue.severity === "Low" ? (
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400"><ShieldCheck className="w-4 h-4" /></div>
                        ) : issue.severity === "Medium" ? (
                          <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400"><AlertTriangle className="w-4 h-4" /></div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400"><AlertTriangle className="w-4 h-4" /></div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{issue.title || issue.name}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{issue.desc || issue.detail}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
                      <ShieldCheck className="w-12 h-12 text-emerald-500 mb-4" />
                      <p className="text-sm font-medium text-slate-500">ไม่พบปัญหาความปลอดภัยระดับปานกลางขึ้นไป</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    รายชื่อสินทรัพย์และโดเมนระบบงาน ({faculty.assets?.length ?? 0})
                  </div>
                  {faculty.assets && faculty.assets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {faculty.assets.map((asset: string, idx: number) => (
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
                            href={asset}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline shrink-0 ml-2"
                          >
                            เปิดเว็บ &rarr;
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                      <Server className="w-12 h-12 text-slate-300 mb-4" />
                      <p className="text-sm font-medium text-slate-500">ไม่พบข้อมูลสินทรัพย์และโดเมนในระบบ</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
