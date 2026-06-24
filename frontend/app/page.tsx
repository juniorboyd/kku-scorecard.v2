"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Search, Landmark, BarChart2, Mail, UserCheck, MessageSquare, LogIn } from "lucide-react";
import { authApi } from "@/lib/api";

export default function LandingPage() {
  const router = useRouter();
  const [loginLoading, setLoginLoading] = useState(false);

  // Redirect already-authenticated users to dashboard
  useEffect(() => {
    authApi.me().then(() => router.replace("/dashboard")).catch(() => undefined);
  }, [router]);

  async function handleLogin() {
    setLoginLoading(true);
    try {
      const r = await authApi.login();
      if (r.redirectUrl) window.location.href = r.redirectUrl;
      else router.replace("/dashboard");
    } catch {
      setLoginLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ─── HERO ─── */}
      <section className="bg-brand-800 text-white">
        <div className="max-w-4xl mx-auto px-6 py-16 flex flex-col items-center text-center gap-5">
          {/* KKU Logo placeholder */}
          <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>

          <div>
            <p className="text-brand-200 text-sm font-medium tracking-widest uppercase mb-2">
              Khon Kaen University
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
              KKU Security Score
            </h1>
            <p className="mt-3 text-brand-200 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
              ระบบติดตามและวิเคราะห์ความปลอดภัยของสินทรัพย์ดิจิทัล
              <br className="hidden sm:block" />
              มหาวิทยาลัยขอนแก่น
            </p>
          </div>
        </div>
      </section>

      {/* ─── FEATURE CARDS ─── */}
      <section className="max-w-4xl mx-auto px-6 py-14 w-full">
        <h2 className="text-center text-xl font-semibold text-gray-800 mb-8">ระบบนี้ทำอะไรได้บ้าง?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              icon: Search,
              title: "ตรวจจับช่องโหว่",
              desc: "ดึงข้อมูลจาก SecurityScorecard และแสดงผลแบบ real-time ครอบคลุมทุก domain ของ KKU",
            },
            {
              icon: Landmark,
              title: "จัดกลุ่มตามคณะ/หน่วยงาน",
              desc: "แยกปัญหาตาม domain ของแต่ละองค์กรใน KKU ให้เห็นภาพรวมและรายละเอียดในที่เดียว",
            },
            {
              icon: BarChart2,
              title: "Dashboard & Reports",
              desc: "วิเคราะห์ความเสี่ยงและติดตามแนวโน้มได้ทันที พร้อมกราฟและสถิติที่อ่านง่าย",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-gray-100 bg-gray-50 p-6 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-800/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-brand-800" />
              </div>
              <h3 className="text-base font-semibold text-gray-800">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── NOTICE BOX ─── */}
      <section className="max-w-4xl mx-auto px-6 pb-10 w-full">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm font-semibold text-amber-800 mb-4">
            ก่อนเข้าใช้งานระบบ กรุณาอ่านข้อกำหนดต่อไปนี้
          </p>
          <ul className="space-y-3">
            {[
              { icon: Mail, text: "ต้องใช้อีเมล @kkumail.com หรือ @kku.ac.th เท่านั้น" },
              { icon: UserCheck, text: "ต้องได้รับการเพิ่มสิทธิ์จาก Admin ก่อนถึงจะสามารถเข้าสู่ระบบได้" },
              { icon: MessageSquare, text: "หากยังไม่มีสิทธิ์ กรุณาติดต่อผู้ดูแลระบบเพื่อขอเพิ่ม Role" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <Icon className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-amber-800">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ─── LOGIN BUTTON ─── */}
      <section className="max-w-4xl mx-auto px-6 pb-14 w-full flex justify-center">
        <button
          onClick={handleLogin}
          disabled={loginLoading}
          className="inline-flex items-center gap-3 px-8 py-4 bg-brand-800 hover:bg-brand-900 active:bg-brand-950 text-white text-base font-semibold rounded-xl shadow-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <LogIn className="w-5 h-5" />
          {loginLoading ? "กำลังเชื่อมต่อ..." : "เข้าสู่ระบบด้วย KKU SSO"}
        </button>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="mt-auto border-t border-gray-100 py-6">
        <p className="text-center text-xs text-gray-400">
          สำนักดิจิทัล มหาวิทยาลัยขอนแก่น &nbsp;·&nbsp; © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
