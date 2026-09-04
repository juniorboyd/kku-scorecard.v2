"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, AlertTriangle, Server, Building2,
  ScrollText, ShieldCheck, Globe, Activity, ArrowLeftRight, Search
} from "lucide-react";
import { useMe } from "@/lib/me";
import LiveScannerModal from "../LiveScannerModal";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; roles?: string[] };

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",     label: "ภาพรวมความปลอดภัย",       icon: LayoutDashboard },
  { href: "/organizations", label: "คะแนนแยกตามคณะ",   icon: Building2 },
  { href: "/comparison",    label: "เปรียบเทียบแนวโน้ม",      icon: ArrowLeftRight },
  { href: "/issues",        label: "รายการปัญหาที่พบ",          icon: AlertTriangle },
  { href: "/assets",        label: "IP Address / Domain",          icon: Server },
  { href: "/api-request",   label: "ร้องขอ API",          icon: Activity },
  { href: "/guide",         label: "คู่มือ & สูตรคำนวณ",    icon: ScrollText },
];

export default function Sidebar() {
  const path = usePathname();
  const me = useMe();
  const role = me?.role;
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const NAV = NAV_ITEMS.filter((item) => !item.roles || (role != null && item.roles.includes(role)));

  return (
    <>
      <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-shrink-0 flex flex-col justify-between transition-all duration-300 z-30">
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg leading-none tracking-tight bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">Security</h1>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">SCORECARD SYSTEM</span>
            </div>
          </div>

          {/* Active Domain Widget / Scanner Trigger */}
          <button
            onClick={() => setIsScannerOpen(true)}
            className="w-full mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 hover:from-blue-100 hover:to-indigo-100 border border-blue-200/60 dark:border-slate-700/80 p-3.5 rounded-xl flex items-center justify-between transition group text-left shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-600 text-white rounded-lg group-hover:scale-105 transition-transform">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                  สแกนโดเมน/IP
                  <Search className="w-3 h-3 text-blue-500" />
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">สแกนแบบเรียลไทม์</div>
              </div>
            </div>
            <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-1 rounded-lg shadow-sm">
              LIVE
            </span>
          </button>

          {/* Navigation */}
          <nav className="space-y-1.5">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = path.startsWith(href) || (href === '/dashboard' && path === '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/35 border-l-4 border-blue-600 dark:border-blue-400"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border-l-4 border-transparent"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <LiveScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        initialTarget="kku.ac.th"
      />
    </>
  );
}
