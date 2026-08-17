"use client";
import React from "react";
import { X, ExternalLink, ShieldAlert, Server, Calendar, Info, ShieldCheck, AlertTriangle, Lightbulb } from "lucide-react";

interface IssueDetailInfo {
  description: string;
  remediation: string;
}

// พจนานุกรมคำอธิบายและแนวทางแก้ไขปัญหา (Issue Info Map)
const ISSUE_INFO: Record<string, IssueDetailInfo> = {
  "unsafe implementation of subresource integrity": {
    description: "มีการใช้งานสคริปต์หรือไฟล์จากภายนอก (เช่น CDN) โดยไม่ได้ระบุค่าแฮชตรวจสอบความถูกต้อง (Subresource Integrity - SRI) ทำให้หากโฮสต์ภายนอกนั้นโดนแฮกเกอร์โจมตีและฝังโค้ดร้าย เว็บไซต์ของคุณจะโหลดโค้ดอันตรายนั้นไปรันในเครื่องของผู้ใช้โดยอัตโนมัติ",
    remediation: "ใส่แอตทริบิวต์ `integrity` (ระบุแฮชความถูกต้องแบบ SHA-256/384/512 ของไฟล์นั้น) พร้อมกับแอตทริบิวต์ `crossorigin=\"anonymous\"` ลงในแท็ก `<script>` หรือ `<link>` ทุกครั้งที่ดึงสคริปต์หรือสไตล์ซีทจากภายนอกมาใช้งาน"
  },
  "tls service supports weak cipher suite": {
    description: "เว็บเซิร์ฟเวอร์เปิดใช้งานระบบเข้ารหัสการเชื่อมต่อ (Cipher Suite) ที่ล้าสมัย อ่อนแอ หรือมีช่องโหว่ (เช่น RC4, 3DES, หรือ CBC modes ใน TLS 1.2) ซึ่งอาจทำให้ผู้โจมตีสามารถถอดรหัสข้อมูลที่รับส่งระหว่างเบราว์เซอร์กับเซิร์ฟเวอร์ได้",
    remediation: "ปิดการใช้งาน Cipher Suites ที่มีความปลอดภัยต่ำบนไฟล์กำหนดค่าของเว็บเซิร์ฟเวอร์ (เช่น Nginx, Apache หรือ IIS) และแนะนำให้เปิดใช้เฉพาะรหัสการเข้ารหัสที่ปลอดภัยสูง เช่น AES-GCM หรือ CHACHA20-POLY1305 และตั้งค่าให้รองรับ TLS 1.2 และ TLS 1.3 เท่านั้น"
  },
  "website does not implement x-content-type-options": {
    description: "เว็บเซิร์ฟเวอร์ไม่ได้ส่งการตอบสนองพร้อม Header `X-Content-Type-Options: nosniff` ส่งผลให้เว็บเบราว์เซอร์บางรุ่นพยายามคาดเดาประเภทไฟล์เอง (MIME Sniffing) ซึ่งอาจนำไปสู่การโหลดไฟล์ภาพหรืออัปโหลดทั่วไปแล้วไปประมวลผลเป็นโค้ดร้ายรันสคริปต์อันตรายได้ (XSS)",
    remediation: "กำหนดค่าตอบกลับบนเว็บเซิร์ฟเวอร์ (เช่นในไฟล์กำหนดค่า Nginx, Apache, .htaccess) ให้ส่ง HTTP Response Header: `X-Content-Type-Options: nosniff` ออกไปด้วยในทุกการตอบสนอง"
  },
  "content security policy (csp) missing": {
    description: "เว็บไซต์ไม่มีการตั้งค่า Content Security Policy (CSP) ซึ่งทำหน้าที่จำกัดสิทธิ์ว่าเบราว์เซอร์สามารถดาวน์โหลดทรัพยากรหรือรันโค้ดจากแหล่งใดได้บ้าง ทำให้เสี่ยงต่อการถูกฝังโค้ดอันตรายบนเว็บ (Cross-Site Scripting หรือ XSS)",
    remediation: "เขียนและกำหนดค่า Header `Content-Security-Policy` บนเว็บเซิร์ฟเวอร์ โดยระบุแหล่งข้อมูลภายนอกและภายในที่น่าเชื่อถืออย่างเข้มงวด เช่น `default-src 'self'; script-src 'self' https://trusted-cdn.com;` เป็นต้น"
  },
  "website does not implement hsts": {
    description: "ไม่มีการเปิดใช้งานนโยบายบังคับเชื่อมต่อ HTTPS (HTTP Strict Transport Security - HSTS) ทำให้แฮกเกอร์สามารถดักจับการเชื่อมต่อของผู้ใช้และปลอมหน้าเว็บให้เป็น HTTP ธรรมดา (พอร์ต 80) เพื่อดักจับรหัสผ่านหรือข้อมูลสำคัญได้",
    remediation: "เพิ่ม Response Header: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` บนเว็บเซิร์ฟเวอร์ เพื่อสั่งให้เว็บเบราว์เซอร์บังคับใช้การเชื่อมต่อแบบ HTTPS เสมอในทุกระดับซับโดเมน"
  },
  "website does not implement strict-transport-security": {
    description: "ไม่มีการเปิดใช้งานนโยบายบังคับเชื่อมต่อ HTTPS (HTTP Strict Transport Security - HSTS) ทำให้แฮกเกอร์สามารถดักจับการเชื่อมต่อของผู้ใช้และปลอมหน้าเว็บให้เป็น HTTP ธรรมดา (พอร์ต 80) เพื่อดักจับรหัสผ่านหรือข้อมูลสำคัญได้",
    remediation: "เพิ่ม Response Header: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` บนเว็บเซิร์ฟเวอร์ เพื่อสั่งให้เว็บเบราว์เซอร์บังคับใช้การเชื่อมต่อแบบ HTTPS เสมอในทุกระดับซับโดเมน"
  },
  "website does not implement x-frame-options": {
    description: "เว็บไซต์ไม่ได้ส่งค่า Header `X-Frame-Options` เพื่อป้องกันการเปิดหน้าเว็บภายใต้ iframe ของเว็บไซต์อื่นๆ ส่งผลให้เว็บไซต์เสี่ยงต่อการโจมตีประเภท Clickjacking (การหลอกให้ผู้ใช้คลิกทำธุรกรรมบางอย่างบน iframe ล่องหนที่ซ้อนทับอยู่)",
    remediation: "เพิ่ม HTTP Response Header: `X-Frame-Options: SAMEORIGIN` หรือใช้คุณสมบัติ `frame-ancestors 'self'` ในนโยบาย Content Security Policy (CSP) บนเว็บเซิร์ฟเวอร์"
  },
  "server information leakage": {
    description: "เซิร์ฟเวอร์เปิดเผยข้อมูลยี่ห้อและรุ่นของซอฟต์แวร์ที่ให้บริการ (เช่น Apache/2.4.x, Nginx/1.18.x, หรือ PHP/7.4.x) ออกมาใน Response Header ซึ่งจะทำให้แฮกเกอร์สามารถระบุช่องโหว่ความปลอดภัยที่ตรงกับเวอร์ชันเหล่านั้นและโจมตีได้ง่ายดายยิ่งขึ้น",
    remediation: "ปรับตั้งค่าเว็บเซิร์ฟเวอร์เพื่อปิดการแสดงข้อมูลรายละเอียดเวอร์ชัน เช่น ตั้งค่า `ServerTokens ProductOnly` และ `ServerSignature Off` บน Apache หรือระบุ `server_tokens off;` บน Nginx หรือตั้งค่า `expose_php = Off` In php.ini"
  },
  "dkim record": {
    description: "พบประเด็นปัญหาเกี่ยวกับการตรวจสอบความถูกต้องของอีเมลผู้ส่ง (DomainKeys Identified Mail) เพื่อป้องกันการปลอมแปลงชื่อผู้ส่งในระดับโดเมนหลักของระบบคุณ ซึ่งอาจส่งผลต่อการถูกจัดประเภทเป็นอีเมลขยะ (Spam) หรืออีเมลฟิชชิ่ง",
    remediation: "กำหนดคีย์สาธารณะ DKIM (TXT Record) ที่สร้างขึ้นจากระบบอีเมลของคุณ นำไปใส่ไว้ในบันทึก DNS (DNS Record) ของโดเมนหลักเพื่อให้ระบบปลายทางสามารถนำกุญแจสาธารณะนี้ไปตรวจสอบความถูกต้องของอีเมลได้"
  },
  "possible typosquat domains detected": {
    description: "ระบบตรวจพบการจดทะเบียนโดเมนภายนอกใหม่ที่มีตัวสะกดใกล้เคียงกับโดเมนหลักของมหาวิทยาลัยสูงมาก (เช่น kku-ac.th, kku.ac.com) ซึ่งมีเป้าหมายหลักในการเตรียมเปิดหน้าเว็บแอบอ้างสวมรอย หรือทำแคมเปญหลอกลวงดักรหัสผ่าน (Phishing) ของบุคลากร",
    remediation: "เฝ้าระวังและติดตามกิจกรรมของโดเมนเลียนแบบดังกล่าว หากพบว่ามีการแสดงผลหน้าเว็บลอกเลียนแบบหรือพยายามส่งอีเมลหลอกลวง ให้ดำเนินการแจ้งรายงานความประพฤติมิชอบ (Abuse Report) หรือแจ้งลบโดเมน (Takedown) ต่อผู้ให้บริการรับจดทะเบียนโดเมนนั้นๆ หรือพิจารณาจดทะเบียนชื่อสำคัญดักหน้าเอาไว้เอง"
  },
  "high-severity cvss v3.0 vulnerability": {
    description: "ระบบตรวจพบบริการเซิร์ฟเวอร์ที่มีช่องโหว่ทางเทคนิคระดับความรุนแรงสูง (High Severity) ซึ่งถูกกำหนดรหัส CVE สากลในฐานข้อมูลช่องโหว่ระดับประเทศ โดยแฮกเกอร์สามารถใช้ช่องโหว่นี้เพื่อบุกรุก สิทธิ์ควบคุม หรือขัดขวางการทำงานของระบบได้",
    remediation: "ทำการระบุบริการและ IP Address เป้าหมาย จากนั้นดำเนินการอัปเดตระบบปฏิบัติการและซอฟต์แวร์บริการเหล่านั้นให้เป็นเวอร์ชันล่าสุดเพื่ออุดช่องโหว่ความปลอดภัย (Security Patch) รวมถึงปิดช่องทางพอร์ตบริการทางอินเทอร์เน็ตที่ไม่มีความจำเป็น"
  }
};

export default function IssueDetailModal({
  issue,
  onClose,
}: {
  issue: any;
  onClose: () => void;
}) {
  const sev = (issue.severity ?? "").toUpperCase();
  const issueTitle = issue.issueTypeTitle || issue.title || issue.name || "Unknown Issue";
  
  // หาคำอธิบายและแนวทางแก้ไขปัญหา
  let descriptionText = "ยังไม่มีคำอธิบายเพิ่มเติมสำหรับปัญหานี้";
  let remediationText = "";
  for (const [key, info] of Object.entries(ISSUE_INFO)) {
    if (issueTitle.toLowerCase().includes(key.toLowerCase())) {
      descriptionText = info.description;
      remediationText = info.remediation;
      break;
    }
  }
  
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
                {issueTitle}
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
          
          {/* Issue Explanation */}
          <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex gap-3">
            <Lightbulb className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-1">ความหมายของปัญหานี้</h4>
              <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                {descriptionText}
              </p>
            </div>
          </div>

          {/* Issue Remediation */}
          {remediationText && (
            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-xl p-4 flex gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-100 mb-1">แนวทางแก้ไข (Remediation)</h4>
                <p className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  {remediationText}
                </p>
              </div>
            </div>
          )}
          
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
