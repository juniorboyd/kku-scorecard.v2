"use client";
import { BookOpen, Calculator, Info, ShieldAlert, ShieldCheck } from "lucide-react";

export default function GuidePage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          คู่มือการใช้งานและสูตรคำนวณ
        </h1>
      </div>

      <div className="card p-6 border-t-4 border-blue-600 space-y-6">
        <section>
          <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-500" />
            ภาพรวมระบบ
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
            Security Scorecard System เป็นระบบที่ใช้สำหรับประเมินและติดตามระดับความปลอดภัยทางไซเบอร์ของสินทรัพย์ (Assets) และโดเมนต่างๆ ที่อยู่ภายใต้ความรับผิดชอบของแต่ละหน่วยงาน โดยมีการเก็บรวบรวมข้อมูลปัญหาความปลอดภัย (Vulnerabilities/Issues) และนำมาประมวลผลเป็นคะแนน (Score) และระดับ (Grade) เพื่อให้หน่วยงานสามารถนำไปปรับปรุงแก้ไขได้อย่างตรงจุด
          </p>
        </section>

        <hr className="border-slate-100 dark:border-slate-800" />

        <section>
          <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-500" />
            สูตรคำนวณคะแนน
          </h2>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mb-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
              ระบบใช้สมการ Exponential Decay เพื่อคำนวณคะแนนรวม โดยมีวัตถุประสงค์เพื่อไม่ให้คะแนนลดลงเร็วเกินไปเมื่อพบปัญหาจำนวนมาก และให้ความสำคัญกับปัญหาที่มีระดับความรุนแรงสูง
            </p>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-sm text-center text-blue-700 dark:text-blue-300 font-bold my-4">
              Final Score = 100 × e^(-Total Impact / 150)
            </div>
            <p className="text-xs text-slate-500">
              * ค่า <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">150</code> คือค่าคงที่ (Scaling Factor) ที่ใช้ปรับอัตราการลดทอนของคะแนน
            </p>
          </div>

          <h3 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-3 mt-6">
            แต้มลดทอน (Impact) ตามระดับความรุนแรง
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800/30">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span className="font-bold text-red-700 dark:text-red-400">HIGH</span>
              </div>
              <p className="text-xs text-red-600/80 dark:text-red-400/80 mb-2">ความรุนแรงระดับสูง</p>
              <div className="text-xl font-bold text-red-700 dark:text-red-400">
                10 <span className="text-sm font-normal">แต้ม/รายการ</span>
              </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800/30">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-4 h-4 text-orange-600" />
                <span className="font-bold text-orange-700 dark:text-orange-400">MEDIUM</span>
              </div>
              <p className="text-xs text-orange-600/80 dark:text-orange-400/80 mb-2">ความรุนแรงระดับกลาง</p>
              <div className="text-xl font-bold text-orange-700 dark:text-orange-400">
                5 <span className="text-sm font-normal">แต้ม/รายการ</span>
              </div>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-emerald-700 dark:text-emerald-400">LOW</span>
              </div>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mb-2">ความรุนแรงระดับต่ำ</p>
              <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                1 <span className="text-sm font-normal">แต้ม/รายการ</span>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-blue-700 dark:text-blue-400">INFO</span>
              </div>
              <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mb-2">ข้อแนะนำ/ข้อมูล</p>
              <div className="text-xl font-bold text-blue-700 dark:text-blue-400">
                0 <span className="text-sm font-normal">แต้ม/รายการ</span>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-slate-100 dark:border-slate-800" />

        <section>
          <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200">เกณฑ์การจัดระดับ (Grade)</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">ระดับ (Grade)</th>
                  <th className="px-4 py-3 font-semibold">ช่วงคะแนน</th>
                  <th className="px-4 py-3 font-semibold">ความหมาย</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                <tr>
                  <td className="px-4 py-3 font-bold text-emerald-600">A</td>
                  <td className="px-4 py-3">90 - 100</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">มีความปลอดภัยระดับดีมาก พบปัญหาจำนวนน้อยมากหรือไม่มีเลย</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-bold text-blue-600">B</td>
                  <td className="px-4 py-3">80 - 89</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">มีความปลอดภัยระดับดี อาจพบปัญหาความรุนแรงระดับกลางหรือต่ำบางส่วน</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-bold text-yellow-600">C</td>
                  <td className="px-4 py-3">70 - 79</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">มีความปลอดภัยระดับปานกลาง ควรเริ่มดำเนินการแก้ไขปัญหา</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-bold text-orange-600">D</td>
                  <td className="px-4 py-3">60 - 69</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">มีความปลอดภัยระดับต่ำ พบปัญหาความรุนแรงระดับสูงหลายรายการ</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-bold text-red-600">F</td>
                  <td className="px-4 py-3">0 - 59</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">มีความเสี่ยงด้านความปลอดภัยสูงมาก ต้องดำเนินการแก้ไขโดยด่วน</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
