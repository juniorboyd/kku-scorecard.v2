"use client";
import { useState } from "react";
import { Activity, Send } from "lucide-react";
import KpiCard from "@/components/ui/KpiCard";

export default function ApiRequestPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-600" />
          ระบบร้องขอ API
        </h1>
      </div>
      
      <div className="card p-6 border-t-4 border-blue-600">
        <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200">แบบฟอร์มขอใช้งาน API</h2>
        <p className="text-sm text-slate-500 mb-6">กรอกข้อมูลเพื่อขอรับ API Key หรือสิทธิ์ในการเข้าถึงข้อมูลจากระบบ</p>
        
        <form className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">วัตถุประสงค์ในการใช้งาน</label>
            <input type="text" className="input w-full" placeholder="ระบุเหตุผล หรือระบบที่ต้องการเชื่อมต่อ" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">รายละเอียดเพิ่มเติม</label>
            <textarea className="input w-full h-24 py-2" placeholder="อธิบายรายละเอียดข้อมูลที่ต้องการ..."></textarea>
          </div>
          <button type="button" className="btn-primary flex items-center gap-2 mt-2">
            <Send className="w-4 h-4" /> ส่งคำร้องขอ
          </button>
        </form>
      </div>
    </div>
  );
}
