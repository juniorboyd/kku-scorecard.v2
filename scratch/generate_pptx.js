const pptxgen = require('pptxgenjs');

// Create presentation
let pptx = new pptxgen();
pptx.layout = 'LAYOUT_16x9';

// Light Theme Styling constants
const BG_COLOR = 'F8FAFC';     // Clean Light Blue-gray (Off-white)
const CARD_BG = 'FFFFFF';      // Pure White for cards
const KKU_ORANGE = 'EA580C';   // Darker orange for better contrast on light bg (#ea580c)
const KKU_ORANGE_MUTED = 'FFEDD5'; // Light orange background for highlight boxes
const TEXT_PRIMARY = '0F172A';  // Very Dark Slate (#0f172a)
const TEXT_MUTED = '475569';    // Slate Gray (#475569)
const CARD_BORDER = 'E2E8F0';   // Light gray border (#e2e8f0)
const GREEN = '16A34A';        // Strong Green for contrast (#16a34a)
const RED = 'DC2626';          // Strong Red for contrast (#dc2626)

// Helper function to set slide background
function setLightBackground(slide) {
    slide.background = { fill: BG_COLOR };
}

// Helper to add standard slide header
function addSlideHeader(slide, title, subtitle) {
    setLightBackground(slide);
    
    // Subtitle (Top Small)
    slide.addText(subtitle.toUpperCase(), {
        x: 0.8, y: 0.4, w: 11.7, h: 0.3,
        fontSize: 11,
        fontFace: 'Sarabun',
        color: KKU_ORANGE,
        bold: true
    });
    
    // Main Title
    slide.addText(title, {
        x: 0.8, y: 0.7, w: 11.7, h: 0.6,
        fontSize: 28,
        fontFace: 'Sarabun',
        color: TEXT_PRIMARY,
        bold: true
    });
    
    // Divider line (using rectangle shape)
    slide.addShape(pptx.shapes.RECTANGLE, {
        x: 0.8, y: 1.4, w: 11.7, h: 0.015,
        fill: { color: CARD_BORDER }
    });
}

// ==================== SLIDE 1: COVER ====================
let slide1 = pptx.addSlide();
setLightBackground(slide1);

// Top accent line
slide1.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: '100%', h: 0.1,
    fill: { color: KKU_ORANGE }
});

// Logo placeholder (Hexagon)
slide1.addShape(pptx.shapes.HEXAGON, {
    x: 5.9, y: 1.2, w: 1.5, h: 1.5,
    fill: { color: CARD_BG },
    line: { color: KKU_ORANGE, width: 2 }
});

// Tick mark icon inside hexagon
slide1.addText("✔", {
    x: 5.9, y: 1.2, w: 1.5, h: 1.5,
    fontSize: 40,
    fontFace: 'Sarabun',
    color: KKU_ORANGE,
    align: 'center',
    valign: 'middle'
});

// Title Text
slide1.addText("ระบบแดชบอร์ดประเมินและติดตาม\nความปลอดภัยทางไซเบอร์ มข.", {
    x: 1.0, y: 3.0, w: 11.333, h: 1.4,
    fontSize: 32,
    fontFace: 'Sarabun',
    color: TEXT_PRIMARY,
    bold: true,
    align: 'center'
});

// Subtitle Text
slide1.addText("KKU Security Scorecard & Vulnerability Management Dashboard", {
    x: 1.0, y: 4.5, w: 11.333, h: 0.5,
    fontSize: 16,
    fontFace: 'Sarabun',
    color: TEXT_MUTED,
    align: 'center'
});


// ==================== SLIDE 2: WHAT IS IT ====================
let slide2 = pptx.addSlide();
addSlideHeader(slide2, "ทำอะไร (What is it?)", "01. Overview");

// Highlight card (Left Column)
slide2.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.8, y: 1.7, w: 5.0, h: 1.3,
    fill: { color: KKU_ORANGE_MUTED },
    line: { color: KKU_ORANGE, width: 1 }
});

slide2.addText("KKU Security Scorecard คือ ระบบแดชบอร์ดประเมินและวิเคราะห์ความปลอดภัยไซเบอร์แบบ Full-stack ที่รวบรวมข้อมูลสถานะช่องโหว่ความเสี่ยงของทุกคณะและหน่วยงานในมหาวิทยาลัยขอนแก่นมาแสดงผลในที่เดียว", {
    x: 1.0, y: 1.8, w: 4.6, h: 1.1,
    fontSize: 13.5,
    fontFace: 'Sarabun',
    color: TEXT_PRIMARY
});

// Bullet Description of Features (Left Bottom)
let slide2Bullets = [
    { text: "•  Security Rating: ", bold: true, color: KKU_ORANGE },
    { text: "ประเมินและวัดผลระบบเครือข่าย โดเมน และเว็บไซต์ โดยตัดเกรดเป็นตัวอักษร (A-F) เพื่อให้เข้าใจง่าย\n\n", color: TEXT_PRIMARY },
    { text: "•  Centralized Database: ", bold: true, color: KKU_ORANGE },
    { text: "รวบรวมและจัดเก็บข้อมูลช่องโหว่และคะแนนความเสี่ยงจาก API และการอัปโหลดไฟล์ (CSV) ย้อนหลัง\n\n", color: TEXT_PRIMARY },
    { text: "•  Interactive Map: ", bold: true, color: KKU_ORANGE },
    { text: "แสดงพิกัดที่ตั้งคณะย่อยผ่านแผนที่ ปักหมุดสีตามเกรดความปลอดภัยเพื่อชี้เป้าหน่วยงานที่เสี่ยงสูงได้ทันที", color: TEXT_PRIMARY }
];

slide2.addText(slide2Bullets, {
    x: 0.8, y: 3.2, w: 5.0, h: 3.5,
    fontSize: 12.5,
    fontFace: 'Sarabun'
});

// Right Column: Dashboard screenshot
slide2.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 6.0, y: 1.7, w: 6.5, h: 4.8,
    fill: { color: CARD_BG },
    line: { color: CARD_BORDER, width: 1 }
});

slide2.addImage({
    path: 'images/map.png',
    x: 6.05, y: 1.75, w: 6.4, h: 4.7
});


// ==================== SLIDE 3: WHY ====================
let slide3 = pptx.addSlide();
addSlideHeader(slide3, "ทำไมถึงทำ (Why did we do it?)", "02. Motivation");

// Left Bullets
let bulletsText = [
    { text: "•  โครงข่ายขนาดใหญ่และซับซ้อน: ", bold: true, color: KKU_ORANGE },
    { text: "มหาวิทยาลัยขอนแก่นมีคณะย่อยและหน่วยงานกว่า 21 แห่ง ซึ่งดูแลรับผิดชอบเซิร์ฟเวอร์และอุปกรณ์เครือข่ายของตนเอง แยกจากส่วนกลาง\n\n", color: TEXT_PRIMARY },
    { text: "•  ภัยคุกคามรอบด้าน: ", bold: true, color: KKU_ORANGE },
    { text: "ความเสี่ยงจากเซิร์ฟเวอร์ที่ละเลยการติดตั้ง Patch (CVE), โดเมนหลอกลวง, DNS Spoofing, และความปลอดภัยของเว็บไซต์ย่อย\n\n", color: TEXT_PRIMARY },
    { text: "•  ขาดศูนย์กลางข้อมูล (No Visibility): ", bold: true, color: KKU_ORANGE },
    { text: "ผู้บริหารและทีมความปลอดภัยส่วนกลางขาดหน้าจอ Dashboard บูรณาการคะแนนสุขภาพของทุกคณะพร้อมกัน\n\n", color: TEXT_PRIMARY },
    { text: "•  การทำงานและแก้ไขที่ล่าช้า: ", bold: true, color: KKU_ORANGE },
    { text: "เมื่อระบบตรวจพบช่องโหว่ การชี้เป้าเครื่องเซิร์ฟเวอร์และระบุตัวผู้ดูแลระบบของแต่ละหน่วยงานย่อยใช้เวลาทำงานนาน", color: TEXT_PRIMARY }
];

slide3.addText(bulletsText, {
    x: 0.8, y: 1.7, w: 6.2, h: 5.0,
    fontSize: 13,
    fontFace: 'Sarabun'
});

// Right Alert Card
slide3.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 7.6, y: 1.7, w: 4.9, h: 4.8,
    fill: { color: 'FEF2F2' },
    line: { color: RED, width: 1 }
});

slide3.addText("⚠️ ความเสี่ยงของระบบย่อย", {
    x: 7.9, y: 2.0, w: 4.3, h: 0.4,
    fontSize: 16,
    fontFace: 'Sarabun',
    color: RED,
    bold: true
});

slide3.addText("เนื่องจากระบบของทุกหน่วยงานเชื่อมโยงอยู่ในเน็ตเวิร์กเดียวกัน ช่องโหว่ของคณะเล็ก ๆ เพียงแห่งเดียว อาจกลายเป็นประตูให้แฮกเกอร์เจาะเข้าถึงเครือข่ายส่วนกลางทั้งหมดได้\n\nระบบนี้จึงมุ่งแก้ปัญหาด้วยการสร้างแหล่งข้อมูลแห่งความจริงหนึ่งเดียว (Single Source of Truth) เพื่อยกระดับความปลอดภัยร่วมกัน", {
    x: 7.9, y: 2.5, w: 4.3, h: 3.7,
    fontSize: 12.5,
    fontFace: 'Sarabun',
    color: TEXT_MUTED
});


// ==================== SLIDE 4: SOLUTION ====================
let slide4 = pptx.addSlide();
addSlideHeader(slide4, "แก้ปัญหาได้อย่างไร (How we solve it)", "03. Solution");

// Left bullets
let solBullets = [
    { text: "•  รวมข้อมูลจากหลายแหล่ง: ", bold: true, color: KKU_ORANGE },
    { text: "รวบรวมช่องโหว่ความมั่นคงปลอดภัยผ่านช่องทางสด (SecurityScorecard API) และการอัปโหลดไฟล์รายงานแบบแมนนวล (CSV Import)\n\n", color: TEXT_PRIMARY },
    { text: "•  อัลกอริทึมแมปปิ้งอัตโนมัติ: ", bold: true, color: KKU_ORANGE },
    { text: "พัฒนาระบบสืบค้นโดเมนย่อย (Matched Domain) ชี้เป้าระบุหน่วยงานรับผิดชอบตามระบบบัญชีรายชื่อคณะ 21 หน่วยงานได้โดยอัตโนมัติ\n\n", color: TEXT_PRIMARY },
    { text: "•  แสดงผลเชิงตำแหน่ง: ", bold: true, color: KKU_ORANGE },
    { text: "แผนที่วิทยาเขต Leaflet.js ปักหมุดที่ตั้งแต่ละคณะด้วยโลโก้คณะและรหัสสีตามระดับเกรด เพื่อให้ระบุจุดเสี่ยงบนพิกัดแผนที่ได้ทันที\n\n", color: TEXT_PRIMARY },
    { text: "•  ระบบจัดการความรุนแรง: ", bold: true, color: KKU_ORANGE },
    { text: "จัดหมวดหมู่แยกความเสี่ยง (Critical, High, Medium, Info) ให้ทีมไอทีจัดลำดับการอุดช่องโหว่ได้ถูกต้อง", color: TEXT_PRIMARY }
];

slide4.addText(solBullets, {
    x: 0.8, y: 1.7, w: 5.0, h: 5.0,
    fontSize: 13,
    fontFace: 'Sarabun'
});

// Right Column: Faculty Details Popup screenshot
slide4.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 6.0, y: 1.7, w: 6.5, h: 4.8,
    fill: { color: CARD_BG },
    line: { color: CARD_BORDER, width: 1 }
});

slide4.addImage({
    path: 'images/details.png',
    x: 6.05, y: 1.75, w: 6.4, h: 4.7
});


// ==================== SLIDE 5: METHODOLOGY ====================
let slide5 = pptx.addSlide();
addSlideHeader(slide5, "ทำอย่างไร (How did we do it?)", "04. Technology");

// Left Column (System Architecture)
slide5.addText("สถาปัตยกรรมระบบ (Full-stack Monorepo)", {
    x: 0.8, y: 1.7, w: 5.0, h: 0.4,
    fontSize: 16,
    fontFace: 'Sarabun',
    color: KKU_ORANGE,
    bold: true
});

slide5.addText("ระบบได้รับการออกแบบเป็น Microservices ที่ทำงานร่วมกันอย่างสมบูรณ์แบบบน Docker-compose เพื่อความง่ายต่อการพัฒนาและติดตั้งใช้จริงในเซิร์ฟเวอร์กลาง", {
    x: 0.8, y: 2.1, w: 5.0, h: 0.8,
    fontSize: 12.5,
    fontFace: 'Sarabun',
    color: TEXT_MUTED
});

let archBullets = [
    { text: "•  Frontend: ", bold: true, color: KKU_ORANGE },
    { text: "Next.js ทำงานร่วมกับ Leaflet.js ในส่วนการแสดงผลและแผนที่โต้ตอบ\n", color: TEXT_PRIMARY },
    { text: "•  Backend: ", bold: true, color: KKU_ORANGE },
    { text: "Node.js (Express Framework) พร้อมระบบจัดการตารางผ่าน Prisma ORM\n", color: TEXT_PRIMARY },
    { text: "•  Database: ", bold: true, color: KKU_ORANGE },
    { text: "PostgreSQL จัดเก็บข้อมูลอย่างเป็นโครงสร้าง ทนทาน และมีประสิทธิภาพ\n", color: TEXT_PRIMARY },
    { text: "•  Python Processor: ", bold: true, color: KKU_ORANGE },
    { text: "สคริปต์ Python วิเคราะห์ คัดกรอง และประมวลผลข้อมูลช่องโหว่ความเสี่ยง\n", color: TEXT_PRIMARY },
    { text: "•  Nginx Proxy: ", bold: true, color: KKU_ORANGE },
    { text: "Reverse Proxy ช่วยจัดการเส้นทางและเชื่อมต่ออย่างปลอดภัย (HTTPS)", color: TEXT_PRIMARY }
];

slide5.addText(archBullets, {
    x: 0.8, y: 3.0, w: 5.0, h: 3.7,
    fontSize: 12,
    fontFace: 'Sarabun'
});

// Right Column: IP / Domain List screenshot
slide5.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 6.0, y: 1.7, w: 6.5, h: 4.8,
    fill: { color: CARD_BG },
    line: { color: CARD_BORDER, width: 1 }
});

slide5.addImage({
    path: 'images/ip_domains.png',
    x: 6.05, y: 1.75, w: 6.4, h: 4.7
});


// ==================== SLIDE 6: RESULTS ====================
let slide6 = pptx.addSlide();
addSlideHeader(slide6, "ผลลัพธ์เป็นอย่างไร (Results)", "05. Outcomes");

// Left Column (Outcomes text)
let outcomesBullets = [
    { text: "•  ศูนย์รวมสถานะความปลอดภัย: ", bold: true, color: KKU_ORANGE },
    { text: "ระบบแดชบอร์ดช่วยให้ผู้ดูแลระบบกลาง มองเห็นคะแนนความปลอดภัย ประวัติความคืบหน้า และประวัติย้อนหลังของหน่วยงานย่อย 21 แห่งได้ทั้งหมดในที่เดียว\n\n", color: TEXT_PRIMARY },
    { text: "•  ลดเวลาแก้ปัญหาแบบเจาะจง: ", bold: true, color: KKU_ORANGE },
    { text: "เปลี่ยนขั้นตอนค้นหาเจ้าของเครื่องเซิร์ฟเวอร์แบบเดิม ให้เป็นการกรองและแจ้งเตือนผ่าน API/CSV สังเคราะห์และส่งงานต่อให้เจ้าหน้าที่ไอทีคณะได้รวดเร็ว\n\n", color: TEXT_PRIMARY },
    { text: "•  สร้างความตระหนักรู้การป้องกันภัย: ", bold: true, color: KKU_ORANGE },
    { text: "ระดับเกรด A-F ช่วยแปลงรายงานเชิงเทคนิคของช่องโหว่ (เช่น DNS record ผิดพลาด, SSL certificate หมดอายุ) ให้เป็นการวัดผลระดับองค์กรที่ผู้บริหารเข้าใจทันที", color: TEXT_PRIMARY }
];

slide6.addText(outcomesBullets, {
    x: 0.8, y: 1.7, w: 5.0, h: 5.0,
    fontSize: 13,
    fontFace: 'Sarabun'
});

// Right Column: Issues list Table screenshot
slide6.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 6.0, y: 1.7, w: 6.5, h: 4.8,
    fill: { color: CARD_BG },
    line: { color: CARD_BORDER, width: 1 }
});

slide6.addImage({
    path: 'images/issues.png',
    x: 6.05, y: 1.75, w: 6.4, h: 4.7
});


// ==================== SLIDE 7: LAUNCH ====================
let slide7 = pptx.addSlide();
addSlideHeader(slide7, "เข้าใช้งานระบบจริง (Live Dashboard)", "06. Launch");

// Centered Link Card
slide7.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 3.4, y: 2.2, w: 6.5, h: 3.5,
    fill: { color: CARD_BG },
    line: { color: KKU_ORANGE, width: 2 }
});

slide7.addText("เปิดแดชบอร์ดติดตามความปลอดภัยทางไซเบอร์ มข.", {
    x: 3.6, y: 2.5, w: 6.1, h: 0.4,
    fontSize: 15,
    fontFace: 'Sarabun',
    color: TEXT_PRIMARY,
    bold: true,
    align: 'center'
});

slide7.addText("https://odt-scorecard.kku.ac.th/dashboard", {
    x: 3.8, y: 3.0, w: 5.7, h: 0.5,
    fontSize: 17,
    fontFace: 'Sarabun',
    color: KKU_ORANGE,
    bold: true,
    align: 'center'
});

// Login Warning notice box
slide7.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 4.2, y: 3.6, w: 4.9, h: 0.5,
    fill: { color: 'FEF2F2' },
    line: { color: RED, width: 1 }
});

slide7.addText("🔒 ต้องติดต่อผู้ดูแลระบบ (Admin) เพื่อขอรับสิทธิ์เข้าใช้งานผ่านระบบ KKU SSO ด้วยบัญชี @kkumail.com", {
    x: 4.2, y: 3.6, w: 4.9, h: 0.5,
    fontSize: 10.5,
    fontFace: 'Sarabun',
    color: RED,
    bold: true,
    align: 'center',
    valign: 'middle'
});

// Mock Launch button shape
slide7.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 5.16, y: 4.4, w: 3.0, h: 0.6,
    fill: { color: KKU_ORANGE },
    line: { color: KKU_ORANGE }
});

slide7.addText("เข้าสู่เว็บไซต์ระบบ ➜", {
    x: 5.16, y: 4.4, w: 3.0, h: 0.6,
    fontSize: 13,
    fontFace: 'Sarabun',
    color: 'FFFFFF',
    bold: true,
    align: 'center',
    valign: 'middle'
});

slide7.addText("* สามารถคลิกเพื่อลิงก์เข้าสู่หน้าเว็บแดชบอร์ดรายงานช่องโหว่ความเสี่ยง", {
    x: 3.4, y: 5.9, w: 6.5, h: 0.4,
    fontSize: 11,
    fontFace: 'Sarabun',
    color: TEXT_MUTED,
    align: 'center'
});

// Save
pptx.writeFile({ fileName: 'presentation_light.pptx' })
    .then(fileName => {
        console.log(`Presentation successfully saved as ${fileName}`);
    })
    .catch(err => {
        console.error("Error creating presentation:", err);
    });
