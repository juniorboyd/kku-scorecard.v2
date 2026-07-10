"use client";
import React from "react";
import { X, ExternalLink, ShieldAlert, Server, Calendar, Info, ShieldCheck, AlertTriangle } from "lucide-react";

export default function IssueDetailModal({
  issue,
  onClose,
}: {
  issue: any;
  onClose: () => void;
}) {
  const sev = (issue.severity ?? "").toUpperCase();
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              {sev === "LOW" || sev === "INFO" ? (
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400"><ShieldCheck className="w-5 h-5" /></div>
              ) : sev === "MEDIUM" ? (
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400"><AlertTriangle className="w-5 h-5" /></div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400"><ShieldAlert className="w-5 h-5" /></div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
                {issue.issueTypeTitle || issue.title || issue.name || "Unknown Issue"}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  sev === "HIGH" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" :
                  sev === "MEDIUM" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400" :
                  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                }`}>
                  {sev || "UNKNOWN"}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Impact: {issue.scoreImpact?.toFixed(3) ?? "0.000"}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Organization</div>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {issue.organizationName || "Unknown (ไม่ระบุสังกัด)"}
              </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Factor Area</div>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {issue.factorName || "—"}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-3 h-3" /> Asset / IP / Domain
              </span>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-sm font-mono text-slate-700 dark:text-slate-300 break-all">
                {issue.asset || issue.matchedDomain || issue.host || "—"}
                {issue.assetType && (
                  <span className="ml-2 inline-block bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold">
                    {issue.assetType.toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ExternalLink className="w-3 h-3" /> Target URL
              </span>
              {issue.finalUrl ? (
                <a href={issue.finalUrl} target="_blank" rel="noopener noreferrer" className="bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-sm font-medium text-blue-600 dark:text-blue-400 break-all transition-colors flex items-center justify-between group">
                  <span>{issue.finalUrl}</span>
                  <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                </a>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-sm text-slate-400 italic">
                  No URL provided
                </div>
              )}
            </div>
          </div>

          {(issue.headers || issue.desc || issue.detail) && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3 h-3" /> Additional Details / Headers
              </span>
              <div className="bg-slate-900 dark:bg-black p-4 rounded-xl border border-slate-800 overflow-x-auto">
                <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap leading-relaxed">
                  {issue.headers || issue.desc || issue.detail}
                </pre>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <Calendar className="w-3.5 h-3.5" />
            Detected at: {issue.createdAt ? new Date(issue.createdAt).toLocaleString("en-GB", { dateStyle: "long", timeStyle: "medium" }) : "—"}
          </div>

        </div>
      </div>
    </div>
  );
}
