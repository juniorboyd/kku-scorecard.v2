"use client";
import { useState } from "react";
import { Search, ShieldAlert, ShieldCheck, RefreshCw, AlertTriangle, CheckCircle2, XCircle, Globe, Server, Lock, Cpu, Cookie, Radio } from "lucide-react";
import Modal from "./ui/Modal";
import { scannerApi } from "@/lib/api";

interface LiveScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTarget?: string;
}

export default function LiveScannerModal({ isOpen, onClose, initialTarget = "" }: LiveScannerModalProps) {
  const [target, setTarget] = useState(initialTarget);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!target.trim()) return;

    setLoading(true);
    setError(null);
    setScanResult(null);

    try {
      const res = await scannerApi.scanTarget(target.trim());
      if (res.success) {
        setScanResult(res.data);
      } else {
        setError(res.message || "Failed to complete scan");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Error connecting to scanner service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="🛡️ Real-time Target Security Inspector (สแกนตรวจโดเมน/IP แบบเรียลไทม์)" maxWidth="max-w-4xl">
      <div className="space-y-5">
        {/* Search / Scan Trigger Form */}
        <form onSubmit={handleScan} className="flex gap-2">
          <div className="relative flex-1">
            <Globe className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="กรอก Domain หรือ IP (เช่น kku.ac.th, md.kku.ac.th, 202.28.92.172)"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !target.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 shadow-md shadow-blue-500/20"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? "กำลังสแกนสด..." : "เริ่มสแกน"}
          </button>
        </form>

        {error && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scan Results */}
        {scanResult && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header / Score Banner */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-800 dark:text-slate-100">{scanResult.target}</span>
                  {scanResult.isOnline ? (
                    <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Online ({scanResult.httpStatus || 200}) — {scanResult.responseTimeMs}ms
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 text-xs font-semibold rounded-full flex items-center gap-1">
                      Unreachable / Offline
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">สแกนเมื่อ: {new Date(scanResult.scannedAt).toLocaleString("th-TH")}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-400">Health Score</div>
                  <div className={`text-2xl font-black ${scanResult.healthScore >= 80 ? "text-emerald-600" : scanResult.healthScore >= 50 ? "text-amber-500" : "text-rose-600"}`}>
                    {scanResult.healthScore} / 100
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Checks Breakdown (4 Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* SSL Cert Card */}
              <div className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <Lock className="w-4 h-4 text-blue-500" />
                  SSL / TLS Certificate
                </div>
                {scanResult.sslInfo ? (
                  <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span>สถานะ:</span>
                      <span className={scanResult.sslInfo.valid ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                        {scanResult.sslInfo.valid ? "ถูกต้อง (Valid)" : "หมดอายุ (Expired)"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>คงเหลือ:</span>
                      <span className="font-semibold">{scanResult.sslInfo.daysRemaining} วัน</span>
                    </div>
                    <div className="flex justify-between truncate">
                      <span>ผู้ออกใบรับรอง:</span>
                      <span className="font-medium truncate max-w-[160px]">{scanResult.sslInfo.issuer || "—"}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">ไม่พบใบรับรอง SSL หรือเชื่อมต่อพอร์ต 443 ไม่ได้</p>
                )}
              </div>

              {/* DNS Security Card */}
              <div className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <Server className="w-4 h-4 text-purple-500" />
                  DNS Security Check
                </div>
                <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>SPF Record:</span>
                    {scanResult.dnsInfo?.hasSpf ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> พบข้อมูล</span>
                    ) : (
                      <span className="text-amber-600 font-bold flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> ไม่พบ</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span>DMARC Policy:</span>
                    {scanResult.dnsInfo?.hasDmarc ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> พบข้อมูล</span>
                    ) : (
                      <span className="text-amber-600 font-bold flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> ไม่พบ</span>
                    )}
                  </div>
                  <div className="flex justify-between truncate">
                    <span>IP Resolution:</span>
                    <span className="font-mono text-[11px] truncate max-w-[160px]">{scanResult.dnsInfo?.ipAddresses?.join(", ") || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Web Tech & Server Card */}
              <div className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <Cpu className="w-4 h-4 text-emerald-500" />
                  Web Technology & Server
                </div>
                <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>CMS Framework:</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">{scanResult.techDetection?.cms || "ไม่พบระบุ"}</span>
                  </div>
                  <div className="flex justify-between truncate">
                    <span>Server Banner:</span>
                    <span className="font-mono text-[11px] truncate max-w-[160px]">{scanResult.techDetection?.serverBanner || "ซ่อนข้อมูล"}</span>
                  </div>
                  <div className="flex justify-between truncate">
                    <span>Meta Generator:</span>
                    <span className="font-mono text-[11px] truncate max-w-[160px]">{scanResult.techDetection?.exposedMetaGenerator || "ซ่อนข้อมูล"}</span>
                  </div>
                </div>
              </div>

              {/* Ports & Cookie Audit Card */}
              <div className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <Radio className="w-4 h-4 text-orange-500" />
                  Ports & Cookie Security
                </div>
                <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>พอร์ตเปิด (Common Ports):</span>
                    <span className="font-mono text-[11px]">
                      {scanResult.portChecks?.filter((p: any) => p.isOpen).map((p: any) => `${p.port}(${p.service})`).join(", ") || "ไม่มีพอร์ตสุ่มเสี่ยงเปิด"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>จำนวน Cookie ที่พบ:</span>
                    <span className="font-semibold">{scanResult.cookieAudits?.length || 0} ตัว</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Findings List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                ผลการตรวจวิเคราะห์และข้อบกพร่องที่พบ ({scanResult.findings.length})
              </h4>
              {scanResult.findings.length === 0 ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>ไม่พบข้อบกพร่องรุนแรงในการสแกนตรวจสอบเบื้องต้น</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {scanResult.findings.map((f: any, idx: number) => (
                    <div key={idx} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-start gap-3 text-xs">
                      {f.severity === "HIGH" ? (
                        <ShieldAlert className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                      ) : f.severity === "MEDIUM" ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{f.issueTypeTitle}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            f.severity === "HIGH" ? "bg-rose-100 text-rose-700" :
                            f.severity === "MEDIUM" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                          }`}>
                            {f.severity} (-{f.scoreImpact} pts)
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">{f.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
