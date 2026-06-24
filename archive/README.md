# 🛡️ KKU WiFi & EDR Security Scorecard Dashboard

> ระบบแดชบอร์ดประเมินและให้คะแนนความปลอดภัยทางไซเบอร์ สำหรับมหาวิทยาลัยขอนแก่น (kku.ac.th)

![Dashboard Preview](https://img.shields.io/badge/Status-Active-emerald?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

---

## 📋 ภาพรวมโปรเจกต์

**KKU Security Scorecard** คือ Web Dashboard แบบ Responsive สำหรับติดตามและประเมินความปลอดภัยทางไซเบอร์ของมหาวิทยาลัยขอนแก่น ครอบคลุม 21 คณะ/หน่วยงาน พร้อมแผนที่แบบ Interactive แสดงตำแหน่งและสถานะความปลอดภัยแต่ละคณะ

### ✨ คุณสมบัติหลัก

| คุณสมบัติ | รายละเอียด |
|-----------|-----------|
| 🎯 **Overall Score** | เกรดความปลอดภัยรวม (A–F) พร้อมคะแนน 0–100 |
| 📊 **4 Security Pillars** | WiFi & Network / Patch & EDR / Portal & App / DNS & Anti-Spoofing |
| 🏫 **Faculty Breakdown** | ตารางข้อมูล 21 คณะ พร้อม Search & Filter ตามเกรด |
| 🗺️ **Interactive Campus Map** | แผนที่ Leaflet.js แสดงตำแหน่งคณะพร้อมโลโก้และ Color-coded markers |
| 🔍 **Drill-down Modal** | ดูรายละเอียดช่องโหว่และสินทรัพย์โดเมนของแต่ละคณะ |
| 📈 **Trend & Radar Charts** | กราฟแนวโน้มคะแนนรายเดือนและเรดาร์เปรียบเทียบ 4 ด้าน |
| 🌗 **Dark/Light Mode** | สลับธีมได้ทันที พร้อม UI Premium |
| 🔔 **Notification System** | แจ้งเตือนความเสี่ยงแบบ Real-time |
| 🔄 **Scan Simulation** | จำลองการสแกนระบบพร้อมอัปเดตคะแนน |
| 🌐 **API Proxy** | เชื่อมต่อ SecurityScorecard API จริงผ่าน Node.js proxy |

---

## 🛠️ เทคโนโลยีที่ใช้

- **Frontend:** HTML5, Tailwind CSS (CDN), Vanilla JavaScript
- **Map:** [Leaflet.js](https://leafletjs.com/) + CARTO Basemaps
- **Charts:** [Chart.js](https://www.chartjs.org/)
- **Icons:** [Lucide Icons](https://lucide.dev/)
- **Fonts:** Inter, Outfit, Sarabun (Google Fonts)
- **Backend:** Node.js + Express (API Proxy Server)

---

## 🚀 วิธีเริ่มต้นใช้งาน

### วิธีที่ 1: เปิดเป็น Static File (ใช้ Mock Data)

เปิดไฟล์ `index.html` ในเบราว์เซอร์ได้โดยตรง — ระบบจะใช้ข้อมูลจำลองจาก `mock-data.js`

```
เปิด index.html ด้วย Browser
```

### วิธีที่ 2: รันผ่าน Node.js Server (รองรับ API จริง)

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. (ไม่บังคับ) ตั้งค่า API Token ของ SecurityScorecard
#    set SSC_API_TOKEN=your_api_token_here   (Windows CMD)
#    $env:SSC_API_TOKEN="your_api_token_here" (PowerShell)

# 3. เริ่มรัน server
npm start

# 4. เปิดเบราว์เซอร์ไปที่
#    http://localhost:3000
```

---

## 📁 โครงสร้างไฟล์

```
scorecard/
├── index.html        # หน้า Dashboard หลัก (HTML + Tailwind)
├── app.js            # Application Logic (Map, Charts, Modals, Theme)
├── mock-data.js      # ข้อมูลจำลอง 21 คณะ + ช่องโหว่ + สินทรัพย์โดเมน
├── styles.css        # Custom CSS (Fonts, Animations, Scrollbar, Map styles)
├── server.js         # Express Proxy Server สำหรับ SecurityScorecard API
├── package.json      # Node.js dependencies
├── .gitignore        # Git ignore rules
└── README.md         # ไฟล์นี้
```

---

## 🗺️ แผนที่คณะ (Campus Map)

แผนที่แสดงตำแหน่งของ 21 คณะ/หน่วยงาน บนวิทยาเขต มข. พร้อม:
- **Pulsing Markers** สีตามระดับเกรด (เขียว → แดง)
- **โลโก้คณะ** แสดงในวงกลมบน marker
- **Popup** แสดงคะแนน, เกรด, อัตราติดตั้ง EDR
- **ปุ่ม "ตรวจสอบจุดอ่อน"** เปิด Modal ดูรายละเอียด

### สีตามระดับเกรด

| เกรด | สี | ความหมาย |
|------|-----|---------|
| **A** | 🟢 Emerald | ปลอดภัยสูง (90–100) |
| **B** | 🟢 Teal | ความเสี่ยงต่ำ (80–89) |
| **C** | 🟡 Amber | ความเสี่ยงปานกลาง (70–79) |
| **D** | 🟠 Orange | ความเสี่ยงสูง (60–69) |
| **F** | 🔴 Rose | วิกฤต (< 60) |

---

## 🔌 SecurityScorecard API Integration

Dashboard สามารถดึงข้อมูลคะแนนจริงจาก [SecurityScorecard Platform](https://platform.securityscorecard.io/) ผ่าน Proxy Server:

1. สมัครบัญชีที่ SecurityScorecard และสร้าง API Token
2. ตั้งค่า Environment Variable: `SSC_API_TOKEN`
3. Server จะ proxy request ไปยัง `https://api.securityscorecard.io/companies/kku.ac.th`
4. หากไม่มี Token ระบบจะ fallback ไปใช้ Mock Data อัตโนมัติ

---

## 🏫 คณะที่ครอบคลุม (21 หน่วยงาน)

| # | คณะ | Abbr | เกรด |
|---|------|------|------|
| 1 | คณะแพทยศาสตร์ | MED | A |
| 2 | วิทยาลัยการคอมพิวเตอร์ | CP | A |
| 3 | คณะวิศวกรรมศาสตร์ | EN | A |
| 4 | คณะนิติศาสตร์ | LAW | B |
| 5 | คณะวิทยาศาสตร์ | SC | B |
| 6 | คณะทันตแพทยศาสตร์ | DENT | B |
| 7 | คณะเภสัชศาสตร์ | PHARM | B |
| 8 | คณะเทคนิคการแพทย์ | AMS | C |
| 9 | คณะเศรษฐศาสตร์ | ECON | C |
| 10 | คณะพยาบาลศาสตร์ | NU | C |
| 11 | คณะสถาปัตยกรรมศาสตร์ | AR | C |
| 12 | บัณฑิตวิทยาลัย | GS | C |
| 13 | คณะเทคโนโลยี | TE | C |
| 14 | คณะสาธารณสุขศาสตร์ | PH | C |
| 15 | คณะศิลปกรรมศาสตร์ | ART | D |
| 16 | คณะสัตวแพทยศาสตร์ | VET | D |
| 17 | คณะสหวิทยาการ (หนองคาย) | IS | D |
| 18 | คณะเกษตรศาสตร์ | AG | D |
| 19 | คณะศึกษาศาสตร์ | EDU | D |
| 20 | คณะบริหารธุรกิจและการบัญชี | KKBS | F |
| 21 | คณะมนุษยศาสตร์และสังคมศาสตร์ | HUSO | F |

---

## 📝 หมายเหตุ

- ข้อมูลช่องโหว่และคะแนนในโหมด Mock Data เป็น **ข้อมูลจำลอง** เพื่อสาธิตการทำงานของระบบ
- ระบบนี้ **ไม่ได้ทำการสแกนหรือโจมตี** ระบบจริงของมหาวิทยาลัย
- สำหรับข้อมูลจริง กรุณาเชื่อมต่อ SecurityScorecard API Token

---

## 👨‍💻 ผู้พัฒนา

**juniorboydd1** — มหาวิทยาลัยขอนแก่น

---

<p align="center">
  สร้างด้วย ❤️ เพื่อความปลอดภัยทางไซเบอร์ของ มข.
</p>
