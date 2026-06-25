export const SECURITY_MOCK_DATA = {
  overallScore: {
    domain: "kku.ac.th",
    score: 79,
    grade: "C",
    status: "Medium Risk",
    statusColor: "text-amber-500",
    bgClass: "bg-amber-500/10 border-amber-500/20",
    gradeColor: "from-amber-500 to-orange-600",
    lastScanned: "2026-06-24 08:30:00",
    totalDevices: 4850,
    activeAlerts: 48,
    trend: [
      { month: "ม.ค.", score: 73 },
      { month: "ก.พ.", score: 74 },
      { month: "มี.ค.", score: 77 },
      { month: "เม.ย.", score: 76 },
      { month: "พ.ค.", score: 78 },
      { month: "มิ.ย.", score: 79 }
    ]
  },
  categories: [
    {
      id: "network",
      name: "WiFi & Network Security (ความปลอดภัยเครือข่ายและ WiFi)",
      score: 82,
      grade: "B",
      status: "ความเสี่ยงต่ำ",
      color: "emerald",
      icon: "wifi",
      desc: "ตรวจสอบการเข้ารหัสผ่านช่องสัญญาณ KKU-WiFi/KKU-Enterprise, พอร์ตควบคุมสัญญาณ AP, และระบบ VLAN Isolation",
      details: {
        totalPortsScanned: 3820,
        openPorts: 34,
        sslGrade: "A-",
        weakCiphers: 4,
        expiredCertificates: 1
      },
      indicators: [
        { name: "การเข้ารหัสสัญญาณ KKU-Enterprise", status: "pass", detail: "เครือข่ายหลักของบุคลากรใช้ WPA3-Enterprise ร่วมกับ KKU SSO อย่างถูกต้อง" },
        { name: "ไฟร์วอลล์แยกโซน WiFi ผู้มาเยือน (KKU-Guest)", status: "pass", detail: "กลุ่มผู้ใช้ภายนอกถูกจำกัดพอร์ตและแยกเครือข่าย (VLAN Isolation)" },
        { name: "พอร์ตควบคุมบน Access Points", status: "warning", detail: "พบ AP บางเครื่องในคณะมนุษยศาสตร์ฯ และคณะเกษตรศาสตร์ เปิดพอร์ตจัดการภายในค้างไว้" },
        { name: "การป้องกันการโจมตีแบบ Rogue AP", status: "pass", detail: "ระบบ WIPS (Wireless Intrusion Prevention) ตรวจจับและบล็อก AP แปลกปลอมได้ถูกต้อง" }
      ]
    },
    {
      id: "patch",
      name: "Patch & EDR Management (การอัปเดตระบบและ EDR)",
      score: 64,
      grade: "D",
      status: "ความเสี่ยงสูง",
      color: "rose",
      icon: "shield-alert",
      desc: "ประเมินการติดตั้งโปรแกรมตรวจจับและตอบสนองภัยคุกคาม (EDR Agent) และการอัปเดตระบบปฏิบัติการบนคอมพิวเตอร์และเซิร์ฟเวอร์",
      details: {
        outdatedSystems: 124,
        cvesDetected: 54,
        criticalCves: 12,
        avgDaysSinceLastUpdate: 92
      },
      indicators: [
        { name: "อัตราติดตั้ง EDR Agent บนเครื่องการเงิน", status: "fail", detail: "พีซีฝ่ายการเงินบางคณะ เช่น คณะบริหารธุรกิจ คณะมนุษยศาสตร์ ขาดการติดตั้ง EDR" },
        { name: "ความพร้อมของ EDR Signature (อัปเดตล่าสุด)", status: "warning", detail: "พบ EDR Agent 18% ขาดการอัปเดตฐานข้อมูลลายนิ้วมือภัยคุกคามนานกว่า 14 วัน" },
        { name: "การแพตช์ความปลอดภัยระบบปฏิบัติการ", status: "fail", detail: "พบเซิร์ฟเวอร์และพีซีรวมกว่า 80 เครื่อง ที่ค้างการอัปเดตความปลอดภัย Windows/Linux OS" },
        { name: "การอัปเดตระบบเซิร์ฟเวอร์ KKU-EDR", status: "pass", detail: "ระบบแม่ข่ายคอนโซลกลางอัปเดตเป็นเวอร์ชันล่าสุดและเชื่อมต่อ Cloud สำเร็จ" }
      ]
    },
    {
      id: "appsec",
      name: "WiFi Portal & App Security (ความปลอดภัยระบบลงทะเบียน)",
      score: 75,
      grade: "C",
      status: "ความเสี่ยงปานกลาง",
      color: "amber",
      icon: "layout",
      desc: "ตรวจสอบการตั้งค่าความปลอดภัยของหน้าเว็บล็อกอิน WiFi Portal และ HTTP Security Headers ของแอปพลิเคชันคณะ",
      details: {
        missingHeaders: 5,
        corsIssues: 3,
        cookieSecurity: "Medium",
        xssProtection: "Partial"
      },
      indicators: [
        { name: "การบังคับใช้โปรโตคอล HTTPS (HSTS)", status: "fail", detail: "หน้าเว็บของคณะเกษตรศาสตร์และศิลปกรรมศาสตร์บางส่วนยังเปิดใช้ HTTP ธรรมดา" },
        { name: "นโยบาย Content Security Policy (CSP)", status: "fail", detail: "หน้าเว็บพอร์ทัลลงทะเบียนหลายแห่งไม่มีการกำหนด CSP ป้องกันการฝังสคริปต์อันตราย" },
        { name: "สิทธิ์เซสชันคุกกี้ (Secure & HttpOnly)", status: "warning", detail: "พอร์ทัลตรวจสอบสิทธิ์บางตัวไม่ได้เปิดแฟล็ก Secure บนเซสชันคุกกี้หลังล็อกอิน" },
        { name: "การส่งข้อมูลรหัสผ่านผ่าน HTTPS เท่านั้น", status: "pass", detail: "หน้าลงทะเบียน WiFi Portal ส่วนใหญ่บังคับส่งข้อมูลผ่าน HTTPS แล้ว" }
      ]
    },
    {
      id: "dns",
      name: "DNS & Anti-Spoofing (ความปลอดภัย DNS ป้องกันเมลปลอม)",
      score: 95,
      grade: "A",
      status: "ปลอดภัยสูง",
      color: "emerald",
      icon: "globe",
      desc: "ตรวจสอบระเบียน DNS ป้องกันภัยคุกคาม เช่น การปลอมแปลงอีเมลสวมรอยส่งอีเมลหลอกลวง (Phishing) ภายใต้ชื่อโดเมนย่อย มข.",
      details: {
        spfConfigured: true,
        dkimConfigured: true,
        dmarcPolicy: "Quarantine (100%)",
        dnssecEnabled: true
      },
      indicators: [
        { name: "ระเบียน SPF (Sender Policy Framework)", status: "pass", detail: "ระเบียน SPF มีความสมบูรณ์และระบุรายการไอพีผู้ส่งเมลจากระบบ KKU อย่างถูกต้อง" },
        { name: "ลายเซ็น DKIM (DomainKeys Identified Mail)", status: "pass", detail: "จดหมายอิเล็กทรอนิกส์ทั้งหมดส่งออกจากโดเมน kku.ac.th ถูกลงนามเข้ารหัสยืนยันตน" },
        { name: "นโยบาย DMARC (Anti-Phishing Record)", status: "warning", detail: "โดเมนย่อยบางคณะ (เช่น huso.kku.ac.th, ag.kku.ac.th) ยังไม่ได้เปิดใช้ DMARC" },
        { name: "ระบบตรวจสอบความถูกต้อง DNSSEC", status: "pass", detail: "เปิดใช้งาน DNSSEC บนเนมเซิร์ฟเวอร์หลักแล้ว เพื่อป้องกันการถูกบิดเบือนเส้นทางไอพี (DNS Hijacking)" }
      ]
    }
  ],
  faculties: [
    {
      id: "med",
      name: "คณะแพทยศาสตร์ มข.",
      nameEn: "Faculty of Medicine",
      score: 96,
      grade: "A",
      colorClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      colorHex: "#10b981",
      devices: 680,
      openPorts: 3,
      criticalAlerts: 0,
      lastScanned: "25 นาทีที่แล้ว",
      edrInstallRate: 98,
      coords: [16.4664986, 102.8280829], // Srinagarind Hospital Area
      icon: "stethoscope",
      abbr: "MED",
      logoUrl: "https://md.kku.ac.th/wp-content/uploads/2020/09/Logo-MD-KKU-1.png",
      assets: [
        "https://md.kku.ac.th",
        "https://srinagarind.md.kku.ac.th",
        "https://acad.md.kku.ac.th",
        "https://admission.md.kku.ac.th",
        "https://planning.md.kku.ac.th",
        "https://webappqshc.kku.ac.th",
        "https://www.bloodbank.kku.ac.th",
        "https://www.medicalrecords.kku.ac.th"
      ],
      issues: []
    },
    {
      id: "computing",
      name: "วิทยาลัยการคอมพิวเตอร์ มข.",
      nameEn: "College of Computing",
      score: 94,
      grade: "A",
      colorClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      colorHex: "#10b981",
      devices: 280,
      openPorts: 5,
      criticalAlerts: 0,
      lastScanned: "15 นาทีที่แล้ว",
      edrInstallRate: 96,
      coords: [16.4754, 102.8224], // Computing Area
      icon: "cpu",
      abbr: "CP",
      logoUrl: "https://computing.kku.ac.th/assets/images/logo/logo.png",
      assets: [
        "https://computing.kku.ac.th",
        "https://api.computing.kku.ac.th",
        "https://appcp.computing.kku.ac.th",
        "https://cms.computing.kku.ac.th",
        "https://eproject.computing.kku.ac.th",
        "https://fin.computing.kku.ac.th",
        "https://fs.computing.kku.ac.th",
        "https://hostcp.computing.kku.ac.th"
      ],
      issues: []
    },
    {
      id: "eng",
      name: "คณะวิศวกรรมศาสตร์ มข.",
      nameEn: "Faculty of Engineering",
      score: 91,
      grade: "A",
      colorClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      colorHex: "#059669",
      devices: 540,
      openPorts: 8,
      criticalAlerts: 1,
      lastScanned: "1 ชั่วโมงที่แล้ว",
      edrInstallRate: 94,
      coords: [16.4725469, 102.8229090], // Engineering Area
      icon: "settings",
      abbr: "EN",
      logoUrl: "https://www.en.kku.ac.th/web/wp-content/uploads/2021/04/EN-logo-transparent.png",
      assets: [
        "https://www.en.kku.ac.th",
        "https://www.enit.kku.ac.th/web",
        "https://app.enit.kku.ac.th/mis",
        "https://app.enit.kku.ac.th/pms",
        "https://checkin.enit.kku.ac.th",
        "https://fix.enit.kku.ac.th",
        "https://vpn.enit.kku.ac.th"
      ],
      issues: [
        {
          title: "SSH Server Service exposing Password Authentication",
          severity: "Medium",
          severityColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          desc: "แล็บคอมพิวเตอร์ภาควิชาวิศวกรรมคอมพิวเตอร์ อนุญาตการล็อกอินเข้าเซิร์ฟเวอร์จำลองด้วยรหัสผ่านผ่าน SSH แทนการใช้ Public Key มีความเสี่ยงต่อการโดนสุ่มรหัสผ่าน Brute-Force",
          recommendation: "แก้ไขไฟล์ตั้งค่า /etc/ssh/sshd_config กำหนด PasswordAuthentication no"
        }
      ]
    },
    {
      id: "law",
      name: "คณะนิติศาสตร์ มข.",
      nameEn: "Faculty of Law",
      score: 89,
      grade: "B",
      colorClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      colorHex: "#10b981",
      devices: 180,
      openPorts: 6,
      criticalAlerts: 0,
      lastScanned: "4 ชั่วโมงที่แล้ว",
      edrInstallRate: 92,
      coords: [16.4501974, 102.8152704], // Law Area
      icon: "scale",
      abbr: "LAW",
      logoUrl: "https://law.kku.ac.th/law2021/images/logo-law-kku.png",
      assets: [
        "https://law.kku.ac.th"
      ],
      issues: []
    },
    {
      id: "sci",
      name: "คณะวิทยาศาสตร์ มข.",
      nameEn: "Faculty of Science",
      score: 85,
      grade: "B",
      colorClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      colorHex: "#10b981",
      devices: 410,
      openPorts: 12,
      criticalAlerts: 2,
      lastScanned: "3 ชั่วโมงที่แล้ว",
      edrInstallRate: 88,
      coords: [16.4756280, 102.8235807], // Science Area
      icon: "flask",
      abbr: "SC",
      logoUrl: "https://sci.kku.ac.th/sc/templates/sc_design2017/images/logo_sc.png",
      assets: [
        "https://sc.kku.ac.th",
        "https://sci.kku.ac.th",
        "https://apps.sc.kku.ac.th",
        "https://chemistry.kku.ac.th",
        "https://physics.sc.kku.ac.th",
        "https://math.kku.ac.th"
      ],
      issues: [
        {
          title: "Exposed RDP Port (3389) on Research Server",
          severity: "High",
          severityColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          desc: "พบพอร์ตสำหรับการรีโมทหน้าจอ (RDP) บนเครื่องเซิร์ฟเวอร์คำนวณเคมีฟิสิกส์ถูกเปิดออกสู่เครือข่ายสัญญาณ WiFi ภายนอกโดยไม่มีไฟร์วอลล์บล็อก",
          recommendation: "จำกัดการเข้าถึงพอร์ต 3389 โดยบังคับให้เชื่อมผ่าน VPN ของมหาวิทยาลัยก่อนเข้าใช้เท่านั้น"
        },
        {
          title: "Insecure HTTP Protocol on Central Research Register Portal",
          severity: "Medium",
          severityColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          desc: "ระบบลงทะเบียนใช้งานอุปกรณ์วิจัยเปิดรับส่งข้อมูลผู้ใช้งานโดยใช้ HTTP ธรรมดาไม่มีการเข้ารหัส SSL/TLS ทำให้ข้อมูลล็อกอินมีโอกาสเสี่ยงถูกดักอ่านได้ง่าย",
          recommendation: "ติดตั้งใบรับรอง SSL/TLS และตั้งค่า Force Redirect จาก HTTP ไปยัง HTTPS"
        }
      ]
    },
    {
      id: "dent",
      name: "คณะทันตแพทยศาสตร์ มข.",
      nameEn: "Faculty of Dentistry",
      score: 83,
      grade: "B",
      colorClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      colorHex: "#10b981",
      devices: 290,
      openPorts: 7,
      criticalAlerts: 1,
      lastScanned: "2 ชั่วโมงที่แล้ว",
      edrInstallRate: 86,
      coords: [16.465134, 102.829023], // Dentistry Area
      icon: "activity",
      abbr: "DENT",
      logoUrl: "https://dentistry.kku.ac.th/dentistry2022/images/logo-dent-kku.png",
      assets: [
        "https://dentistry.kku.ac.th",
        "https://dentist.kku.ac.th",
        "https://dentfinance.kku.ac.th",
        "https://dent-pms.kku.ac.th",
        "https://eleavedent.kku.ac.th",
        "https://dentpatho-digital.kku.ac.th"
      ],
      issues: [
        {
          title: "Exposed Test Server IP (202.28.92.43) via Plain HTTP",
          severity: "Medium",
          severityColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          desc: "เซิร์ฟเวอร์ไอพีภายนอก 202.28.92.43 ของแผนกเปิดให้บริการระบบงานบางส่วนผ่าน HTTP โดยไม่มีการตั้งโดเมนหรือติดตั้ง SSL/TLS",
          recommendation: "กำหนดโดเมนเนมและติดตั้งใบรับรอง SSL พร้อมทั้งปิดรับส่งข้อมูลพอร์ต 80"
        }
      ]
    },
    {
      id: "pharm",
      name: "คณะเภสัชศาสตร์ มข.",
      nameEn: "Faculty of Pharmaceutical Sciences",
      score: 81,
      grade: "B",
      colorClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      colorHex: "#10b981",
      devices: 210,
      openPorts: 6,
      criticalAlerts: 0,
      lastScanned: "5 ชั่วโมงที่แล้ว",
      edrInstallRate: 84,
      coords: [16.4697177, 102.8279138], // Pharmacy Area
      icon: "pill",
      abbr: "PHARM",
      logoUrl: "https://pharmacy.kku.ac.th/images/logo-pharm-kku.png",
      assets: [
        "https://pharmacy.kku.ac.th",
        "https://pharm.kku.ac.th",
        "https://pharmoffice.kku.ac.th",
        "https://herbalbank.kku.ac.th",
        "https://pharmacycompetency.kku.ac.th"
      ],
      issues: []
    },
    {
      id: "ams",
      name: "คณะเทคนิคการแพทย์ มข.",
      nameEn: "Faculty of Associated Medical Sciences",
      score: 79,
      grade: "C",
      colorClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      colorHex: "#f59e0b",
      devices: 190,
      openPorts: 14,
      criticalAlerts: 2,
      lastScanned: "6 ชั่วโมงที่แล้ว",
      edrInstallRate: 79,
      coords: [16.4686570, 102.8273855], // Medical Tech Area
      icon: "microscope",
      abbr: "AMS",
      logoUrl: "https://ams.kku.ac.th/ams2021/images/logo-ams-kku.png",
      assets: [
        "https://ams.kku.ac.th",
        "https://amsclinic.kku.ac.th",
        "https://amsoffice.kku.ac.th",
        "https://cmdl.kku.ac.th",
        "https://cvrg.kku.ac.th",
        "http://202.28.92.155"
      ],
      issues: [
        {
          title: "Public Facing Web Server IP without DNS mapping",
          severity: "Medium",
          severityColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          desc: "พอร์ทัลบริการไอพี 202.28.92.155 เปิดให้บริการเป็น HTTP ธรรมดาโดยไม่มีรหัสความปลอดภัย SSL บล็อก",
          recommendation: "ลงทะเบียน DNS ภายใต้โดเมนย่อยของคณะและบังคับ Redirect ไปยัง HTTPS"
        },
        {
          title: "EDR Agent inactive on clinic check-in computers",
          severity: "Medium",
          severityColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          desc: "เครื่องรับลงทะเบียนคนไข้คลินิกของคณะ 3 เครื่อง ไม่พบการเชื่อมต่อส่งรายงาน EDR Agent มายังส่วนกลาง",
          recommendation: "ตรวจสอบการทำงานของ Service EDR และทำการตั้งค่าเครื่องใหม่"
        }
      ]
    },
    {
      id: "econ",
      name: "คณะเศรษฐศาสตร์ มข.",
      nameEn: "Faculty of Economics",
      score: 78,
      grade: "C",
      colorClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      colorHex: "#f59e0b",
      devices: 140,
      openPorts: 9,
      criticalAlerts: 1,
      lastScanned: "8 ชั่วโมงที่แล้ว",
      edrInstallRate: 77,
      coords: [16.4741700, 102.8296357], // Econ Area
      icon: "trending-up",
      abbr: "ECON",
      logoUrl: "https://econ.kku.ac.th/econ2021/images/logo-econ-kku.png",
      assets: [
        "https://econ.kku.ac.th",
        "https://econmis.kku.ac.th",
        "https://econoffice.kku.ac.th",
        "https://isaninsight.kku.ac.th",
        "https://econcoaching.kku.ac.th"
      ],
      issues: [
        {
          title: "Missing Content Security Policy (CSP) on isaninsight.kku.ac.th",
          severity: "Medium",
          severityColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          desc: "หน้าเว็บข้อมูลสารสนเทศวิจัยอีสาน ขาดการตั้งค่า CSP ทำให้ระบบเสี่ยงต่อการโดน Cross-Site Scripting (XSS)",
          recommendation: "เพิ่ม Header ความปลอดภัย Content-Security-Policy ในการตั้งค่า Nginx/Apache"
        }
      ]
    },
    {
      id: "nu",
      name: "คณะพยาบาลศาสตร์ มข.",
      nameEn: "Faculty of Nursing",
      score: 77,
      grade: "C",
      colorClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      colorHex: "#f59e0b",
      devices: 220,
      openPorts: 12,
      criticalAlerts: 2,
      lastScanned: "10 ชั่วโมงที่แล้ว",
      edrInstallRate: 76,
      coords: [16.4696495, 102.8250225], // Nursing Area
      icon: "heart",
      abbr: "NU",
      logoUrl: "https://nu.kku.ac.th/nu2021/images/logo-nu-kku.png",
      assets: [
        "https://nu.kku.ac.th",
        "https://fon.kku.ac.th",
        "https://nu-mis.kku.ac.th",
        "https://nubooking.kku.ac.th",
        "https://nudorm.kku.ac.th"
      ],
      issues: [
        {
          title: "Legacy HTTP plain protocol on nu-asc.kku.ac.th",
          severity: "Medium",
          severityColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          desc: "เว็บแอปพลิเคชันพอร์ทัลบริการบางส่วนของหน่วยงานใช้ลิงก์ HTTP ส่งรหัสล็อกอินผ่านหน้าเครือข่ายสัญญาณ",
          recommendation: "เปลี่ยนไปใช้ HTTPS และบังคับเข้ารหัสความปลอดภัยในชั้นขนส่ง"
        },
        {
          title: "HSTS Header Missing on Dorm Registry Portal",
          severity: "Low",
          severityColor: "text-slate-500 bg-slate-500/10 border-slate-500/20",
          desc: "ระบบลงทะเบียนหอพักนักศึกษาคณะพยาบาลฯ ขาดการประกาศ HSTS เพื่อบังคับใช้งานใบรับรองความปลอดภัย",
          recommendation: "ตั้งค่า Add Header Strict-Transport-Security ในเว็บเซิร์ฟเวอร์"
        }
      ]
    },
    {
      id: "arch",
      name: "คณะสถาปัตยกรรมศาสตร์ มข.",
      nameEn: "Faculty of Architecture",
      score: 76,
      grade: "C",
      colorClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      colorHex: "#f59e0b",
      devices: 220,
      openPorts: 11,
      criticalAlerts: 3,
      lastScanned: "12 ชั่วโมงที่แล้ว",
      edrInstallRate: 76,
      coords: [16.4717839, 102.8276400], // Architecture Area
      icon: "pen-tool",
      abbr: "AR",
      logoUrl: "https://arch.kku.ac.th/arch2021/images/logo-arch-kku.png",
      assets: [
        "https://arch.kku.ac.th",
        "https://ap.kku.ac.th",
        "https://arthesis.kku.ac.th",
        "https://archapp.kku.ac.th",
        "https://architservice.kku.ac.th"
      ],
      issues: [
        {
          title: "Outdated WordPress CMS version in Faculty Thesis website",
          severity: "High",
          severityColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          desc: "เว็บไซต์ระบบวิทยานิพนธ์ arthesis.kku.ac.th ใช้ WordPress เวอร์ชัน 5.4 ซึ่งมีช่องโหว่ความมั่นคงปลอดภัยร้ายแรงหลายจุดที่ได้รับการเปิดเผยแล้ว",
          recommendation: "ดำเนินการสำรองฐานข้อมูลและอัปเกรดตัวระบบ CMS และปลั๊กอินทั้งหมดเป็นเวอร์ชันล่าสุดทันที"
        },
        {
          title: "EDR Agent missing on library public access computers",
          severity: "Medium",
          severityColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          desc: "เครื่องคอมพิวเตอร์ให้บริการสืบค้นหนังสือ 5 เครื่องไม่มีการติดตั้งโปรแกรมตรวจจับและตอบสนองภัยคุกคาม (EDR Agent)",
          recommendation: "รันระบบ Deploy เพื่อผลักดันตัวติดตั้ง EDR Agent จากคอนโซลกลางไปยังพีซีเป้าหมาย"
        },
        {
          title: "Missing Security Headers on Department Portal",
          severity: "Low",
          severityColor: "text-slate-500 bg-slate-500/10 border-slate-500/20",
          desc: "เว็บแผนกออกแบบไม่มีการตั้งค่า HSTS และ X-Content-Type-Options ใน Web Server Configuration",
          recommendation: "เพิ่ม Header ความปลอดภัยเหล่านี้ในไฟล์ตั้งค่าระบบ Nginx/Apache ของแผนก"
        }
      ]
    },
    {
      id: "gs",
      name: "บัณฑิตวิทยาลัย มข.",
      nameEn: "Graduate School",
      score: 75,
      grade: "C",
      colorClass: "bg-amber-500/10 text-amber-500 border-emerald-500/20",
      colorHex: "#f59e0b",
      devices: 160,
      openPorts: 8,
      criticalAlerts: 1,
      lastScanned: "13 ชั่วโมงที่แล้ว",
      edrInstallRate: 74,
      coords: [16.4760, 102.8250], // Grad School (Bimala building)
      icon: "graduation-cap",
      abbr: "GS",
      logoUrl: "https://gs.kku.ac.th/gs2021/images/logo-gs-kku.png",
      assets: [
        "https://gs.kku.ac.th",
        "https://admission.gs.kku.ac.th",
        "https://gsmis.gs.kku.ac.th",
        "https://lifeskills.gs.kku.ac.th",
        "https://forms.gs.kku.ac.th"
      ],
      issues: [
        {
          title: "SQL injection vulnerability warning on legacy subdomains",
          severity: "High",
          severityColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          desc: "พบโค้ดประมวลผลคำสั่งฐานข้อมูลแบบเก่าบนพอร์ทัลบริการแบบกรอกข้อมูล ซึ่งไม่มีระบบกรองพารามิเตอร์ส่งค่า (Input Sanitization)",
          recommendation: "ปรับปรุงซอร์สโค้ด PHP ในการส่งคิวรีโดยใช้ Prepared Statements เสมอ"
        }
      ]
    },
    {
      id: "tech",
      name: "คณะเทคโนโลยี มข.",
      nameEn: "Faculty of Technology",
      score: 73,
      grade: "C",
      colorClass: "bg-amber-500/10 text-amber-500 border-emerald-500/20",
      colorHex: "#f59e0b",
      devices: 150,
      openPorts: 7,
      criticalAlerts: 1,
      lastScanned: "14 ชั่วโมงที่แล้ว",
      edrInstallRate: 72,
      coords: [16.4739852, 102.8214414], // Tech Area
      icon: "database",
      abbr: "TE",
      logoUrl: "https://te.kku.ac.th/te2021/images/logo-te-kku.png",
      assets: [
        "https://te.kku.ac.th"
      ],
      issues: [
        {
          title: "Insecure SSL protocols enabled (TLS 1.0 / TLS 1.1)",
          severity: "Medium",
          severityColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          desc: "เซิร์ฟเวอร์ te.kku.ac.th ยังคงเปิดใช้งาน TLS รุ่นเก่า 1.0 และ 1.1 ซึ่งไม่ผ่านเกณฑ์ความมั่นคงของข้อมูลทางการเงินและการตรวจสอบสิทธิ์",
          recommendation: "ปรับการตั้งค่า Cipher ในเซิร์ฟเวอร์เพื่อบังคับใช้เฉพาะ TLS 1.2 และ TLS 1.3"
        }
      ]
    },
    {
      id: "ph",
      name: "คณะสาธารณสุขศาสตร์ มข.",
      nameEn: "Faculty of Public Health",
      score: 71,
      grade: "C",
      colorClass: "bg-amber-500/10 text-amber-500 border-emerald-500/20",
      colorHex: "#f59e0b",
      devices: 180,
      openPorts: 10,
      criticalAlerts: 2,
      lastScanned: "16 ชั่วโมงที่แล้ว",
      edrInstallRate: 70,
      coords: [16.4705085, 102.8248688], // Public Health Area
      icon: "heart-pulse",
      abbr: "PH",
      logoUrl: "https://ph.kku.ac.th/ph2021/images/logo-ph-kku.png",
      assets: [
        "https://ph.kku.ac.th",
        "https://coop-ph.kku.ac.th",
        "https://ergoocare.kku.ac.th"
      ],
      issues: [
        {
          title: "Database server connection config leak in debug files",
          severity: "High",
          severityColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          desc: "พบบันทึกดีบั๊กตกค้างในไดเรกทอรีเว็บพอร์ทัลหลักของ PH Coop ซึ่งทำให้แฮกเกอร์มองเห็นโครงสร้างระบบของฐานข้อมูล",
          recommendation: "ลบไฟล์ประเภท log หรือ debug และปรับแก้ค่า display_errors ใน php.ini เป็น Off"
        }
      ]
    },
    {
      id: "fa",
      name: "คณะศิลปกรรมศาสตร์ มข.",
      nameEn: "Faculty of Fine and Applied Arts",
      score: 68,
      grade: "D",
      colorClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      colorHex: "#f97316",
      devices: 130,
      openPorts: 15,
      criticalAlerts: 4,
      lastScanned: "18 ชั่วโมงที่แล้ว",
      edrInstallRate: 68,
      coords: [16.4693332, 102.8176599], // Fine Arts Area
      icon: "palette",
      abbr: "ART",
      logoUrl: "https://fa.kku.ac.th/fa2021/images/logo-fa-kku.png",
      assets: [
        "https://fa.kku.ac.th",
        "https://fabook.kku.ac.th",
        "https://fagallery.kku.ac.th",
        "https://far.kku.ac.th",
        "https://fa-theater.kku.ac.th"
      ],
      issues: [
        {
          title: "No SSL encryption on multiple subdomains",
          severity: "High",
          severityColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          desc: "หน้าเว็บแสดงผลแกลลอรี่และระบบโรงละครย่อย ใช้การเชื่อมต่อผ่านพอร์ต 80 HTTP แบบไม่มีการติดตั้งใบรับรองความปลอดภัยเข้ารหัสข้อมูล",
          recommendation: "ดําเนินการขอรับสิทธิ์ใบรับรอง Let's Encrypt หรือ SSL ของมหาวิทยาลัยและบังคับใช้ HTTPS"
        },
        {
          title: "Missing X-Frame-Options Header",
          severity: "Medium",
          severityColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          desc: "เว็บแผนกไม่ได้ตั้งค่า X-Frame-Options ป้องกันการถูกหลอกลวงให้กดปุ่มสำคัญผ่านการซ้อนทับเฟรม (Clickjacking)",
          recommendation: "ตั้งค่า header 'X-Frame-Options SAMEORIGIN' ใน Apache configuration"
        }
      ]
    },
    {
      id: "vet",
      name: "คณะสัตวแพทยศาสตร์ มข.",
      nameEn: "Faculty of Veterinary Medicine",
      score: 67,
      grade: "D",
      colorClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      colorHex: "#f97316",
      devices: 160,
      openPorts: 11,
      criticalAlerts: 3,
      lastScanned: "20 ชั่วโมงที่แล้ว",
      edrInstallRate: 67,
      coords: [16.4783999, 102.8312002], // Vet Area
      icon: "shield",
      abbr: "VET",
      logoUrl: "https://vet.kku.ac.th/vet2021/images/logo-vet-kku.png",
      assets: [
        "https://vet.kku.ac.th",
        "https://fvm.kku.ac.th/th",
        "https://vmmis.kku.ac.th"
      ],
      issues: [
        {
          title: "Web login cookie missing Secure / HttpOnly flags",
          severity: "Medium",
          severityColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          desc: "ระบบบริหารข้อมูลโรงพยาบาลสัตว์สะสมข้อมูลล็อกอินลงบนคุกกี้ที่ไม่มีสิทธิ์จำกัดความปลอดภัย ทำให้ช่องโหว่ประเภท XSS ดึงค่ารหัสผ่านไปได้ง่าย",
          recommendation: "กำหนดเซสชันคุกกี้ด้วยพารามิเตอร์ Secure; HttpOnly; SameSite=Strict"
        }
      ]
    },
    {
      id: "is",
      name: "คณะสหวิทยาการ มข. (หนองคาย)",
      nameEn: "Faculty of Interdisciplinary Studies",
      score: 66,
      grade: "D",
      colorClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      colorHex: "#f97316",
      devices: 240,
      openPorts: 18,
      criticalAlerts: 4,
      lastScanned: "22 ชั่วโมงที่แล้ว",
      edrInstallRate: 66,
      coords: [17.8049854, 102.7475011], // Coords adjusted near main campus for UI mapping view
      icon: "globe",
      abbr: "IS",
      logoUrl: "https://is.kku.ac.th/is2021/images/logo-is-kku.png",
      assets: [
        "https://is.kku.ac.th",
        "https://api.is.kku.ac.th",
        "https://app.is.kku.ac.th",
        "https://insight-hub.is.kku.ac.th"
      ],
      issues: [
        {
          title: "Publicly Exposed Jenkins DevOps Server port",
          severity: "High",
          severityColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          desc: "พบเครื่องเซิร์ฟเวอร์พัฒนาระบบ Jenkins (jenkins.is.kku.ac.th) เปิดให้เข้าถึงคอนโซลการจัดการบิลด์โค้ดได้โดยตรงจากเครือข่ายภายนอก",
          recommendation: "ปิดพอร์ต Jenkins จากภายนอก หรือจำกัดให้เชื่อมต่อผ่าน SSL VPN มหาวิทยาลัยเท่านั้น"
        }
      ]
    },
    {
      id: "ag",
      name: "คณะเกษตรศาสตร์ มข.",
      nameEn: "Faculty of Agriculture",
      score: 64,
      grade: "D",
      colorClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      colorHex: "#f97316",
      devices: 320,
      openPorts: 24,
      criticalAlerts: 5,
      lastScanned: "1 วันที่แล้ว",
      edrInstallRate: 62,
      coords: [16.4764079, 102.8218693], // Agriculture Area
      icon: "leaf",
      abbr: "AG",
      logoUrl: "https://ag.kku.ac.th/ag2021/images/logo-ag-kku.png",
      assets: [
        "https://ag13.kku.ac.th",
        "https://ag5.kku.ac.th",
        "https://ag6.kku.ac.th",
        "https://ags.kku.ac.th",
        "https://casc.kku.ac.th",
        "https://agfair68.kku.ac.th",
        "https://ag5.kku.ac.th/mg",
        "https://ag2.kku.ac.th/eWorkload"
      ],
      issues: [
        {
          title: "Exposed and Outdated Dashboard CMS (agclassroom/Ag-dashboard)",
          severity: "High",
          severityColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          desc: "ระบบจัดบอร์ดแผนห้องเรียนออนไลน์และแดชบอร์ดสถิติใช้ PHP CMS รุ่นเก่าที่มีช่องโหว่ความมั่นคงระดับรุนแรงหลายจุดค้างไว้",
          recommendation: "ทำการปิดปรับปรุงหน้าเว็บเก่าที่ไม่ได้ใช้งาน หรืออัปเกรดตัวประมวลผล PHP และ CMS"
        },
        {
          title: "CORS Misconfiguration on Faculty APIs",
          severity: "Medium",
          severityColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          desc: "ระบบข้อมูลงานภาระงาน eWorkload มีการตั้งค่า Access-Control-Allow-Origin: * ทำให้ภายนอกสามารถยิงสคริปต์เพื่อดึงข้อมูลภายในได้",
          recommendation: "แก้ไขการตั้งค่า CORS ของ API ให้ระบุเฉพาะชื่อโดเมนหลัก kku.ac.th เท่านั้น"
        }
      ]
    },
    {
      id: "edu",
      name: "คณะศึกษาศาสตร์ มข.",
      nameEn: "Faculty of Education",
      score: 62,
      grade: "D",
      colorClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      colorHex: "#f97316",
      devices: 360,
      openPorts: 28,
      criticalAlerts: 6,
      lastScanned: "1 วันที่แล้ว",
      edrInstallRate: 60,
      coords: [16.4731138, 102.8265673], // Education Area
      icon: "book-open",
      abbr: "EDU",
      logoUrl: "https://edu.kku.ac.th/edu2021/images/logo-edu-kku.png",
      assets: [
        "https://satit.kku.ac.th",
        "https://learnup.kku.ac.th",
        "https://avs.kku.ac.th",
        "https://edlearn.kku.ac.th",
        "https://edoffice.kku.ac.th",
        "https://reg.satit.kku.ac.th"
      ],
      issues: [
        {
          title: "Anonymous Upload directory access on legacy Satit school sites",
          severity: "High",
          severityColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          desc: "พอร์ทัลส่งงานโรงเรียนสาธิตฯ อนุญาตให้บุคคลภายนอกเปิดดูโครงสร้างไฟล์ภายในแฟ้มดาวน์โหลดและส่งข้อมูลอัปโหลดไฟล์ PHP สคริปต์ได้โดยไม่มีการตรวจสอบสิทธิ์",
          recommendation: "แก้ไขการอนุญาตของโฟลเดอร์อัปโหลด ห้ามรันสคริปต์สั่งงานโดยตรง (Disable Execution in upload path)"
        },
        {
          title: "Missing Security Headers on e-Class Portal",
          severity: "Medium",
          severityColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          desc: "ระบบเรียนออนไลน์ eclassnet.kku.ac.th ขาดการระบุค่า Headers ป้องกัน XSS และ Clickjacking",
          recommendation: "ระบุความปลอดภัยในชั้น HTTP Configuration ของ Nginx/IIS"
        }
      ]
    },
    {
      id: "bus",
      name: "คณะบริหารธุรกิจและการบัญชี มข.",
      nameEn: "Faculty of Business Administration",
      score: 55,
      grade: "F",
      colorClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      colorHex: "#ef4444",
      devices: 310,
      openPorts: 20,
      criticalAlerts: 6,
      lastScanned: "1 วันที่แล้ว",
      edrInstallRate: 58,
      coords: [16.4739384, 102.8256076], // Business Administration and Accountancy (BS KKU)
      icon: "briefcase",
      abbr: "KKBS",
      logoUrl: "https://kkbs.kku.ac.th/kkbs2020/images/logo-kkbs.png",
      assets: [
        "https://kkbs.kku.ac.th",
        "https://assetskkbs.kku.ac.th",
        "https://edukkbs.kku.ac.th",
        "https://kkbsalumni.kku.ac.th",
        "https://kkbsregister.kku.ac.th",
        "https://hotkkbs.kku.ac.th",
        "https://kkbsmis.kku.ac.th",
        "https://paymentkkbs.kku.ac.th"
      ],
      issues: [
        {
          title: "Critical Unpatched OS & Missing EDR on Financial PCs",
          severity: "Critical",
          severityColor: "text-rose-600 bg-rose-600/10 border-rose-600/20",
          desc: "คอมพิวเตอร์ในห้องธุรการการเงิน 12 เครื่อง ไม่ได้รับการอัปเดตความปลอดภัยระบบปฏิบัติการ Windows นานกว่า 1 ปี และพบว่า EDR Agent ถูกปิดการทำงาน เสี่ยงต่อการโดนเจาะระบบด้วยมัลแวร์เรียกค่าไถ่",
          recommendation: "บังคับรัน Windows Update และเปิดการทำงานของ EDR Agent และอัปเดตลายเซ็นไวรัสทันที"
        },
        {
          title: "Publicly Exposed Database Port (MySQL - 3306) on register system",
          severity: "High",
          severityColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          desc: "เซิร์ฟเวอร์เก็บข้อมูลงานลงทะเบียนและรายวิชาของคณะ (kkbsregister.kku.ac.th) เปิดพอร์ตฐานข้อมูล 3306 ให้เชื่อมต่อเข้ามาได้ตรงๆ จากเครือข่ายภายนอก",
          recommendation: "ตั้งค่าไฟร์วอลล์ (iptables/UFW) เพื่อบล็อกการเชื่อมต่อพอร์ต 3306 จากภายนอก อนุญาตเฉพาะไอพีแอดเดรสของไอทีกลางและ localhost เท่านั้น"
        },
        {
          title: "Outdated Apache Web Server version (v2.4.41) on main portal",
          severity: "High",
          severityColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          desc: "หน้าเว็บพอร์ทัลหลักของคณะรันอยู่บน Apache v2.4.41 ซึ่งมีช่องโหว่ความปลอดภัยส่งผลให้อาจโดนแฮกเกอร์โจมตีเพื่อรันโค้ดคำสั่งอันตราย (RCE) ได้",
          recommendation: "ทำการคอมไพล์หรืออัปเกรด Apache Web Server ไปยังเวอร์ชันล่าสุด (2.4.59 ขึ้นไป)"
        }
      ]
    },
    {
      id: "human",
      name: "คณะมนุษยศาสตร์และสังคมศาสตร์ มข.",
      nameEn: "Faculty of Humanities and Social Sciences",
      score: 52,
      grade: "F",
      colorClass: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      colorHex: "#ef4444",
      devices: 380,
      openPorts: 32,
      criticalAlerts: 12,
      lastScanned: "2 วันที่แล้ว",
      edrInstallRate: 52,
      coords: [16.4755065, 102.8262861], // Humanities Area (HUSO KKU)
      icon: "users",
      abbr: "HUSO",
      logoUrl: "https://huso.kku.ac.th/huso2021/images/logo-huso-kku.png",
      assets: [
        "https://huso.kku.ac.th",
        "https://hs.kku.ac.th",
        "https://celex.kku.ac.th",
        "https://cle.kku.ac.th",
        "https://gradhuso.kku.ac.th",
        "https://husoalumni.kku.ac.th",
        "https://ischool.kku.ac.th",
        "https://visityasothon.kku.ac.th"
      ],
      issues: [
        {
          title: "Legacy SMB v1 Protocol Enabled on Library File Shares",
          severity: "Critical",
          severityColor: "text-rose-600 bg-rose-600/10 border-rose-600/20",
          desc: "ระบบจัดเก็บและแชร์ไฟล์เอกสารวิจัยในห้องสมุดมนุษยศาสตร์ ยังคงเปิดใช้งานโปรโตคอลแชร์ไฟล์ SMB v1 ซึ่งมีช่องโหว่ระดับวิกฤต เช่น ช่องโหว่ EternalBlue ที่มัลแวร์นำมาใช้แพร่กระจายตัวอย่างรวดเร็ว",
          recommendation: "ปิดการใช้งานโปรโตคอล SMB v1 โดยเด็ดขาดผ่านการตั้งค่า Registry หรือ Group Policy และบังคับใช้ SMB v2/v3 แทน"
        },
        {
          title: "Default Admin Credentials on Network Printers web interface",
          severity: "High",
          severityColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          desc: "เครื่องถ่ายเอกสารและพิมพ์งานระบบเครือข่าย 8 เครื่องที่ติดตั้งตามห้องทำงานคณะ ยังไม่ได้เปลี่ยนรหัสผ่านเริ่มต้น ทำให้ใครก็ตามในวง WiFi สามารถเข้าไปดูข้อมูลและแก้ไขระบบสั่งพิมพ์ได้",
          recommendation: "ทำการเปลี่ยนรหัสผ่านของบัญชีผู้ดูแลระบบ (Admin Password) ของพรินเตอร์ทุกเครื่อง"
        },
        {
          title: "Open Anonymous FTP Server on Research Drive",
          severity: "High",
          severityColor: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          desc: "พบเครื่องจัดเก็บข้อมูลวิจัยของคณาจารย์ (husoasset.kku.ac.th) เปิดให้เข้าใช้งาน FTP โดยใช้บัญชี Anonymous (ไม่มีรหัสผ่าน) และปล่อยให้พอร์ต FTP เชื่อมได้จากอินเทอร์เน็ตสาธารณะ",
          recommendation: "ปิดการเชื่อมต่อแบบ Anonymous และเปลี่ยนมาใช้งาน SFTP ควบคู่กับการยืนยันตัวตนด้วยรหัสส่วนบุคคล"
        },
        {
          title: "No DMARC Record Configured for HUSO Subdomain",
          severity: "Medium",
          severityColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          desc: "โดเมนย่อยส่งข่าวสารหลักของคณะ (@huso.kku.ac.th) ขาดระเบียน DMARC ใน DNS เสี่ยงต่อการโดนสวมรอยส่งอีเมลฟิชชิ่งหาบุคลากรและนักศึกษา",
          recommendation: "เพิ่มระเบียน TXT ใน DNS ของโดเมนย่อย: v=DMARC1; p=quarantine; pct=100"
        }
      ]
    }
  ],
  topAlerts: [
    {
      id: "alert-1",
      faculty: "คณะมนุษยศาสตร์และสังคมศาสตร์ มข.",
      type: "ตรวจพบการเปิดใช้ระบบแชร์ไฟล์ SMB v1 ล้าสมัยระดับวิกฤต",
      severity: "Critical",
      time: "2 วันที่แล้ว"
    },
    {
      id: "alert-2",
      faculty: "คณะบริหารธุรกิจและการบัญชี มข.",
      type: "พบพีซีแผนกการเงิน 12 เครื่องขาดอัปเดตแพตช์หลักและ EDR Agent หาย",
      severity: "Critical",
      time: "1 วันที่แล้ว"
    },
    {
      id: "alert-3",
      faculty: "คณะบริหารธุรกิจและการบัญชี มข.",
      type: "พอร์ตฐานข้อมูล SQL (3306) ถูกปล่อยพับลิกสู่สัญญาณ WiFi สาธารณะ",
      severity: "High",
      time: "1 วันที่แล้ว"
    },
    {
      id: "alert-4",
      faculty: "คณะวิทยาศาสตร์ มข.",
      type: "พอร์ต RDP (3389) เชื่อมต่อตรงได้ทันทีจากภายนอกบนเครื่องวิจัย",
      severity: "High",
      time: "3 ชั่วโมงที่แล้ว"
    }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SECURITY_MOCK_DATA;
}
