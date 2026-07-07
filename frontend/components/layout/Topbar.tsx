"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, CalendarDays, Settings, LogOut, ChevronDown, Search, Bell, Sun, Moon, AlertTriangle } from "lucide-react";
import { useSnapshot } from "@/lib/snapshotContext";
import { useMe } from "@/lib/me";
import { authApi } from "@/lib/api";
import { useTheme } from "next-themes";

const TITLES: Record<string, string> = {
  "/dashboard":     "ภาพรวมความปลอดภัย",
  "/issues":        "รายการปัญหาที่พบ",
  "/assets":        "IP Address / Domain",
  "/organizations": "คะแนนแยกตามคณะ",
  "/imports":       "นำเข้าข้อมูล",
  "/logs":          "บันทึกระบบ (Logs)",
  "/settings":      "การตั้งค่า",
};

const ROLE_BADGE: Record<string, string> = {
  ADMIN:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  ANALYST: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  VIEWER:  "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400",
};



export default function Topbar() {
  const path = usePathname();
  const title = Object.entries(TITLES).find(([k]) => path.startsWith(k))?.[1] ?? "KKU Security Score Card";
  const { snapshots, selectedSnapshotId, setSelectedSnapshotId } = useSnapshot();
  const me = useMe();
  const { theme, setTheme } = useTheme();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close the dropdowns on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const fullName = [me?.firstName, me?.lastName].filter(Boolean).join(" ").trim() || me?.email || "User";
  const role = me?.role ?? "";

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 transition-colors duration-300 z-20">
      {/* Left: title + Search */}
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 shrink-0">{title}</h1>

        <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 w-64 transition-colors">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="ค้นหาคณะ หรือโดเมน..." 
            className="bg-transparent border-none outline-none text-sm ml-2 w-full text-slate-700 dark:text-slate-300 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Right: Actions & profile menu */}
      <div className="flex items-center gap-4">
        
        {snapshots.length > 0 && (
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedSnapshotId ?? ""}
              onChange={(e) => setSelectedSnapshotId(Number(e.target.value))}
              disabled={snapshots.length <= 1}
              className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-transparent border-none outline-none cursor-pointer disabled:opacity-60 disabled:cursor-default"
            >
              {snapshots.map((s) => (
                <option key={s.id} value={s.id} className="text-slate-900">
                  {new Date(s.snapshotDate).toLocaleDateString("en-GB")} — {s.totalIssues.toLocaleString()} issues
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Theme Toggle */}
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-slate-800 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse border-2 border-white dark:border-slate-900"></span>
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">การแจ้งเตือน</h3>
                <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">1 ใหม่</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors bg-blue-50/50 dark:bg-blue-900/10">
                  <div className="flex gap-3">
                    <div className="mt-0.5 text-red-500"><AlertTriangle className="w-4 h-4" /></div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">ระบบตรวจพบปัญหา XSS ใหม่</p>
                      <p className="text-[10px] text-slate-500 mt-1">พบช่องโหว่ความรุนแรงสูงที่โดเมน eng.kku.ac.th</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2"></div>

        {/* User Profile */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-xl p-1 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
              <span className="text-xs font-bold text-white">{fullName.charAt(0)}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/30">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{fullName}</p>
                {me?.facultyName && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{me.facultyName}</p>
                )}
                {role && (
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${ROLE_BADGE[role] ?? "bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-300"}`}>
                      {role}
                    </span>
                  </div>
                )}
              </div>
              <div className="py-2 border-t border-slate-100 dark:border-slate-800">
                <Link href="/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <Settings className="w-4 h-4" />
                  การตั้งค่าบัญชี
                </Link>

              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
