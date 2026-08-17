"use client";
import React from "react";
import { X, ExternalLink, ShieldAlert, Server, Calendar, Info, ShieldCheck, AlertTriangle, Lightbulb } from "lucide-react";

interface IssueDetailInfo {
  description: string;
  remediation: string;
}

// พจนานุกรมคำอธิบายและแนวทางแก้ไขปัญหา (Issue Info Map ครบถ้วนทุกประเด็น)
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
    remediation: "ปรับตั้งค่าเว็บเซิร์ฟเวอร์เพื่อปิดการแสดงข้อมูลรายละเอียดเวอร์ชัน เช่น ตั้งค่า `ServerTokens ProductOnly` และ `ServerSignature Off` บน Apache หรือระบุ `server_tokens off;` บน Nginx หรือตั้งค่า `expose_php = Off` ใน php.ini"
  },
  "dkim record": {
    description: "พบประเด็นปัญหาเกี่ยวกับการตรวจสอบความถูกต้องของอีเมลผู้ส่ง (DomainKeys Identified Mail) เพื่อป้องกันการปลอมแปลงชื่อผู้ส่งในระดับโดเมนหลักของระบบคุณ ซึ่งอาจส่งผลต่อการถูกจัดประเภทเป็นอีเมลขยะ (Spam) หรืออีเมลฟิชชิ่ง",
    remediation: "กำหนดคีย์สาธารณะ DKIM (TXT Record) ที่สร้างขึ้นจากระบบอีเมลของคุณ นำไปใส่ไว้ในบันทึก DNS (DNS Record) ของโดเมนหลักเพื่อให้ระบบปลายทางสามารถนำกุญแจสาธารณะนี้ไปตรวจสอบความถูกต้องของอีเมลได้"
  },
  "possible typosquat domains detected": {
    description: "ระบบตรวจพบการจดทะเบียนโดเมนภายนอกใหม่ที่มีตัวสะกดใกล้เคียงกับโดเมนหลักของมหาวิทยาลัยสูงมาก (เช่น kku-ac.th, kku.ac.com) ซึ่งมีเป้าหมายหลักในการเตรียมเปิดหน้าเว็บแอบอ้างสวมรอย หรือทำแคมเปญหลอกลวงดักรหัสผ่าน (Phishing) ของบุคลากร",
    remediation: "เฝ้าระวังและติดตามกิจกรรมของโดเมนเลียนแบบดังกล่าว หากพบว่ามีการแสดงผลหน้าเว็บลอกเลียนแบบหรือพยายามส่งอีเมลหลอกลวง ให้ดำเนินการแจ้งรายงานความประพฤติมิชอบ (Abuse Report) หรือแจ้งลบโดเมน (Takedown) ต่อผู้ให้บริการรับจดทะเบียนโดเมนนั้นๆ หรือพิจารณาจดทะเบียนชื่อสำคัญดักหน้าเอาไว้เอง"
  },
  "severity cvss v3.0 vulnerability": {
    description: "ระบบตรวจพบบริการเซิร์ฟเวอร์ที่มีช่องโหว่ทางเทคนิคระดับความรุนแรงสูง (High/Critical Severity) ตามมาตรฐาน CVE สากล ซึ่งผู้โจมตีสามารถใช้ช่องโหว่นี้เพื่อบุกรุกระบบ ควบคุมเครื่อง หรือขัดขวางการทำงานได้",
    remediation: "ทำการระบุซอฟต์แวร์และไอพีปลายทาง จากนั้นดำเนินการอัปเดตแพทช์ความปลอดภัยของระบบปฏิบัติการและแอปพลิเคชันบริการนั้นๆ ให้เป็นเวอร์ชันล่าสุด หรือปิดพอร์ตบริการที่ไม่จำเป็นผ่านไฟร์วอลล์เพื่อปิดช่องทางเชื่อมต่อภายนอก"
  },
  "severity cvss v3.0 service vulnerability": {
    description: "ระบบตรวจพบบริการเซิร์ฟเวอร์ที่มีช่องโหว่ทางเทคนิคระดับความรุนแรงสูง (High/Critical Severity) ตามมาตรฐาน CVE สากล ซึ่งผู้โจมตีสามารถใช้ช่องโหว่นี้เพื่อบุกรุกระบบ ควบคุมเครื่อง หรือขัดขวางการทำงานได้",
    remediation: "ทำการระบุซอฟต์แวร์และไอพีปลายทาง จากนั้นดำเนินการอัปเดตแพทช์ความปลอดภัยของระบบปฏิบัติการและแอปพลิเคชันบริการนั้นๆ ให้เป็นเวอร์ชันล่าสุด หรือปิดพอร์ตบริการที่ไม่จำเป็นผ่านไฟร์วอลล์เพื่อปิดช่องทางเชื่อมต่อภายนอก"
  },
  "certificate lifetime is longer than best practices": {
    description: "ใบรับรองความปลอดภัย (SSL/TLS Certificate) มีอายุการใช้งานยาวนานเกินไป (เกินกว่า 398 วัน) ซึ่งไม่ได้เป็นไปตามแนวทางปฏิบัติที่ดีที่สุดสากลในปัจจุบัน เนื่องจากหากกุญแจเข้ารหัสรั่วไหล ความเสียหายจะคงอยู่นานขึ้น",
    remediation: "ขอจดทะเบียนหรือต่ออายุใบรับรองความปลอดภัยใหม่ให้มีอายุไม่เกิน 1 ปี (สูงสุด 397-398 วัน) ต่อรอบการจดทะเบียน แนะนำให้ใช้ระบบอำนวยความสะดวกอย่าง Let's Encrypt หรือ ACME client เพื่อให้ระบุเวลาการใช้งานที่กระชับและปลอดภัย"
  },
  "certificate without revocation control": {
    description: "ใบรับรองความปลอดภัยไม่มีระบบควบคุมการตรวจสอบสิทธิ์ความถูกต้องหลังออกใช้งาน (Revocation Control) เช่น OCSP หรือ CRL ส่งผลให้เบราว์เซอร์ของผู้ใช้ปลายทางไม่สามารถตรวจสอบได้ว่าใบรับรองนี้ถูกเพิกถอนไปก่อนหมดอายุหรือไม่",
    remediation: "เปลี่ยนมาใช้ใบรับรองความปลอดภัยจากผู้ให้บริการ (CA) ที่สนับสนุนกลไก OCSP หรือทำการเปิดใช้งานระบบ OCSP Stapling บนการตั้งค่าของเซิร์ฟเวอร์ เช่น บน Nginx: `ssl_stapling on; ssl_stapling_verify on;`"
  },
  "certificate key is smaller than recommended size": {
    description: "กุญแจเข้ารหัสของใบรับรองความปลอดภัย (Private Key) มีขนาดความสั้นหรือเล็กเกินกว่ามาตรฐานที่แนะนำ (เช่น ขนาดเล็กกว่า RSA 2048 บิต) ซึ่งเสี่ยงต่อการถูกเจาะถอดรหัสได้ง่ายโดยระบบคอมพิวเตอร์ประสิทธิภาพสูง",
    remediation: "สร้างกุญแจเข้ารหัส (Private Key) และคำขอใบรับรอง (CSR) ใหม่ โดยกำหนดขนาดความยาวของกุญแจให้มีความยาวขั้นต่ำเป็น RSA 2048-bit หรือเปลี่ยนมาใช้กุญแจประเภท ECC (Elliptic Curve) แทนเพื่อประสิทธิภาพที่ดีกว่า"
  },
  "content security policy contains 'unsafe-*' directive": {
    description: "นโยบายความปลอดภัยเนื้อหา (CSP) มีการใช้กฎผ่อนผัน เช่น `'unsafe-inline'` หรือ `'unsafe-eval'` ซึ่งขัดแย้งกับหลักการควบคุมความปลอดภัย ทำให้แฮกเกอร์สามารถหาช่องทางทำ Cross-Site Scripting (XSS) ด้วยการฝังคำสั่งสคริปต์แปลกปลอมลงบนหน้าเพจได้โดยตรง",
    remediation: "แก้ไขไฟล์นโยบาย CSP โดยตัดคำสั่งผ่อนผันเหล่านั้นออก และหันมาใช้นโยบายแบบกำหนดค่า Token (`nonce`) หรือตรวจสอบค่าแฮช (`sha256`) ของสคริปต์นั้นๆ แทน เพื่อให้รันได้เฉพาะโค้ดของหน้าเว็บที่ผู้พัฒนาตั้งใจสร้างเท่านั้น"
  },
  "content security policy contains broad directives": {
    description: "นโยบายความปลอดภัยเนื้อหา (CSP) มีการตั้งกฎที่ครอบคลุมขอบเขตกว้างขวางเกินไป (เช่น การใช้เครื่องหมาย wildcard `*` หรืออนุญาตโดเมนที่ไม่น่าเชื่อถือ) ซึ่งเปิดโอกาสให้แฮกเกอร์เชื่อมต่อไปดึงสคริปต์หรือทรัพยากรส่วนหัวจากที่ใดก็ได้บนอินเทอร์เน็ตเข้ามารันบนหน้าเว็บ",
    remediation: "จำกัดโดเมนที่ได้รับอนุญาตในกฎ CSP ให้มีความเฉพาะเจาะจง หลีกเลี่ยงการใช้ `*` และกำหนดรายชื่อโดเมนที่ระบุตัวตนชัดเจน เช่น `script-src 'self' https://www.google-analytics.com;`"
  },
  "credentials at risk": {
    description: "ตรวจพบข้อมูลชื่อบัญชี (Username) หรือรหัสผ่าน (Password) ที่เกี่ยวข้องกับโดเมนของหน่วยงานรั่วไหลไปสู่เครือข่ายอินเทอร์เน็ตสาธารณะ หรือแผ่กระจายอยู่ใน Dark Web ซึ่งอาจถูกนำไปเดาสุ่มเพื่อเข้าสู่ระบบภายในองค์กรได้",
    remediation: "แจ้งผู้ใช้งานเจ้าของบัญชีดังกล่าวให้ทำการเปลี่ยนรหัสผ่านใหม่ทันที (โดยตั้งรหัสผ่านที่มีความซับซ้อนและไม่ซ้ำกับระบบอื่น) และเปิดใช้งานระบบยืนยันตัวตนแบบสองชั้น (Two-Factor Authentication) ในทุกระบบเพื่อสกัดกั้นการแอบอ้างเข้าใช้งาน"
  },
  "insecure https redirect pattern": {
    description: "เว็บไซต์มีรูปแบบการสลับเส้นทางไปใช้งานโปรโตคอลความปลอดภัย (Redirect to HTTPS) ที่ไม่รัดกุม ส่งผลให้ข้อมูลบางส่วนถูกส่งออกไปยังหน้า HTTP ธรรมดาก่อนทำการเปลี่ยนเส้นทาง ซึ่งอาจถูกผู้โจมตีทำ MITM (Man-in-the-Middle) ดักอ่านข้อมูลช่วงสลับโดเมนได้",
    remediation: "ตั้งค่าเว็บเซิร์ฟเวอร์ให้รับมือการร้องขอจาก HTTP (พอร์ต 80) แล้วทำ Redirect ทันทีด้วยรหัสสถานะ `301 Moved Permanently` บังคับให้เปลี่ยนเป็น HTTPS ตั้งแต่วินาทีแรกที่เข้าเว็บ"
  },
  "insufficient dkim key length": {
    description: "ลายเซ็นความปลอดภัยของอีเมล (DKIM Key) มีขนาดความยาวสั้นเกินไป (เช่น 512 หรือ 1024 บิต) ซึ่งมีความเป็นไปได้สูงที่จะถูกคำนวณและปลอมแปลงอีเมลส่งออกในนามโดเมนจริงของคุณ",
    remediation: "สร้างคู่รหัสตรวจสอบอีเมล DKIM ใหม่ให้มีความยาวกุญแจอย่างน้อย 2048 บิตบนระบบเซิร์ฟเวอร์จัดการอีเมลของคุณ จากนั้นนำค่า TXT Record ตัวใหม่ไปอัปเดตบน Domain DNS Record ให้ถูกต้องสอดคล้องกัน"
  },
  "severity cves patching cadence": {
    description: "ตรวจพบการล่าช้าในการปรับปรุงแพทช์ความปลอดภัยเพื่อปิดช่องโหว่ (Vulnerability Patching Cadence) ของระบบปฏิบัติการหรือบริการซอฟต์แวร์ ซึ่งถูกตรวจสอบโดยเทียบเคียงกับระยะเวลามาตรฐานการส่งแพทช์ช่วยเหลือของค่ายผู้พัฒนาหลัก",
    remediation: "ดำเนินนโยบายจัดแพทช์ความปลอดภัยในเครื่องเซิร์ฟเวอร์ปลายทางโดยเร็ว ดำเนินการอัปเกรดระบบปฏิบัติการหรือบริการนั้นๆ เช่น `apt update && apt upgrade` หรือปรับปรุงเวอร์ชันซอฟต์แวร์เพื่อรับแพทช์อุดช่องโหว่ล่าสุด"
  },
  "open port discovered": {
    description: "พบบริการเซิร์ฟเวอร์เปิดพอร์ตเครือข่ายให้บริการภายนอกต่อสาธารณะ ซึ่งบางพอร์ตอาจไม่มีความจำเป็นต่อระบบ หรือเป็นบริการที่มีช่องโหว่ความเสี่ยงสูง",
    remediation: "ตรวจสอบพอร์ตดังกล่าว หากไม่มีความจำเป็นต้องเปิดให้บริการต่อคนทั่วไป ให้ทำการปิดบริการนั้น หรือทำการติดตั้ง Firewall เพื่อจำกัดให้สามารถเข้าถึงพอร์ตดังกล่าวได้เฉพาะไอพี (IP Address) ภายในของหน่วยงานเท่านั้น"
  },
  "sftp": {
    description: "ตรวจพบบริการส่งไฟล์แบบ SFTP หรือ SSH เปิดให้บริการรับคำขอเชื่อมต่อจากภายนอก ซึ่งเสี่ยงต่อการโดนผู้โจมตีสุ่มทายรหัสผ่านเพื่อเข้าควบคุมเครื่องเซิร์ฟเวอร์ปลายทาง (Brute Force Attack)",
    remediation: "กำหนดรหัสผ่านในการเชื่อมต่อให้แข็งแกร่ง แนะนำให้เปลี่ยนไปใช้วิธีการล็อกอินผ่านกุญแจตรวจสอบ (SSH Key-based) และยกเลิกสิทธิ์ล็อกอินผ่าน Password ในไฟล์กำหนดค่า sshd รวมถึงจำกัดการเข้าใช้งานเฉพาะผู้ดูแลระบบ"
  },
  "site does not use best practices against embedding of malicious content": {
    description: "เว็บไซต์ไม่มีการตั้งค่า Header ความปลอดภัยเพื่อจำกัดขอบเขตการนำหน้าเว็บของตนไปฝังไว้ในหน้าต่างของเว็บอันตราย (iframe) ซึ่งเสี่ยงต่อการเกิด Clickjacking หลอกให้ผู้ใช้ทำธุรกรรมโดยเจตนาเคลือบแคลง",
    remediation: "กำหนดค่าตอบกลับบนเว็บเซิร์ฟเวอร์ให้ระบุ Response Header: `X-Frame-Options: SAMEORIGIN` หรือควบคุมผ่าน CSP ในคำสั่ง `frame-ancestors 'self'` เพื่ออนุญาตให้เปิดใช้กรอบได้เฉพาะเว็บของตนเองเท่านั้น"
  },
  "site does not enforce https": {
    description: "เว็บไซต์ยอมให้ผู้ใช้งานสามารถเข้าถึงระบบงานผ่านทาง HTTP ธรรมดา (ไม่เข้ารหัสข้อมูล) โดยไม่บังคับให้สลับไปใช้ช่องทางที่ปลอดภัย (HTTPS) ส่งผลให้ข้อมูลที่ผู้ใช้รับส่งกับเว็บมีโอกาสถูกขโมยหรือแก้ไขระหว่างทางได้ง่าย",
    remediation: "ตั้งค่าเว็บเซิร์ฟเวอร์ (เช่น Nginx, Apache) เพื่อบังคับเปลี่ยนเส้นทางผู้ใช้ทุกคนจาก http:// เป็น https:// เสมอด้วยรหัส HTTP Redirect 301 ในระดับ Global"
  },
  "site emits visible browser logs": {
    description: "หน้าเว็บไซต์มีการพิมพ์และเปิดเผยข้อมูลบันทึกข้อความผิดพลาดหรือประวัติการทำงาน (Console Log / Debugging Information) ออกมายังหน้าคอนโซลของบราวเซอร์ทั่วไป ซึ่งอาจมีเนื้อหาที่เผยเบาะแสการโจมตีหรือข้อมูลไอทีที่ละเอียดอ่อน",
    remediation: "ปิดใช้งานการส่งบันทึกในโค้ดฝั่งไคลเอนต์ โดยถอดคำสั่งประเภท `console.log()` ออกจากตัวสคริปต์หน้าเว็บที่ใช้แสดงผลจริง หรือเขียนฟังก์ชันครอบเพื่อสกัดไม่ให้พิมพ์ log ในสภาพแวดล้อมที่ใช้งานจริง"
  },
  "website copyright is not current": {
    description: "ข้อความประกาศลิขสิทธิ์ความปลอดภัยบริเวณท้ายหน้าต่างเว็บไซต์ (Footer Copyright) ระบุปี ค.ศ. หรือ พ.ศ. เป็นปีในอดีต ซึ่งบ่งชี้ว่าตัวหน้าเว็บขาดการทำนุบำรุงหรือดูแลรักษา และอาจส่งผลต่อความน่าเชื่อถือด้านความปลอดภัยของผู้ใช้งาน",
    remediation: "ดำเนินการปรับปรุงตัวเลขปีของลิขสิทธิ์บนหน้าเว็บไซต์ให้เป็นปีปัจจุบัน แนะนำให้ใช้สคริปต์สั้นๆ ดึงเวลาปัจจุบันมาเปลี่ยนแสดงผลอัตโนมัติ เช่น `new Date().getFullYear()` ใน JavaScript"
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
