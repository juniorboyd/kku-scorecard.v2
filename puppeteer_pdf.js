const puppeteer = require('puppeteer');
const fs = require('fs');

const htmlContent = `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>Progress Summary</title>
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Sarabun', sans-serif;
            color: #333;
            margin: 0;
            padding: 40px;
            box-sizing: border-box;
        }
        h1 {
            text-align: center;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        h2 {
            text-align: center;
            color: #7f8c8d;
            margin-top: 0;
            font-size: 1.2rem;
            margin-bottom: 30px;
        }
        h3 {
            color: #2980b9;
            border-bottom: 2px solid #2980b9;
            padding-bottom: 5px;
            margin-top: 30px;
        }
        ul {
            line-height: 1.6;
            font-size: 14px;
        }
        .logos {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 20px;
            margin-bottom: 10px;
        }
        .logos img {
            width: 80px;
            height: auto;
        }
        .caption {
            text-align: center;
            font-size: 12px;
            color: #7f8c8d;
        }
        .progress-container {
            margin-top: 30px;
        }
        .progress-item {
            margin-bottom: 15px;
        }
        .progress-label {
            font-size: 14px;
            margin-bottom: 5px;
        }
        .progress-bar-bg {
            background-color: #ecf0f1;
            border-radius: 5px;
            overflow: hidden;
            width: 100%;
            height: 20px;
        }
        .progress-bar-fill {
            background-color: #27ae60;
            height: 100%;
            text-align: center;
            color: white;
            font-size: 12px;
            line-height: 20px;
        }
        .footer {
            margin-top: 50px;
            text-align: right;
            font-size: 12px;
            color: #95a5a6;
        }
    </style>
</head>
<body>
    <h1>สรุปความคืบหน้าโครงการ</h1>
    <h2>KKU Security Score Card</h2>

    <h3>งานที่ดำเนินการล่าสุด (Recent Updates)</h3>
    <ul>
        <li><strong>Bypass ระบบ Login:</strong> ปรับแก้ให้เข้าถึง Dashboard ได้รวดเร็วขึ้น เพื่อความสะดวกในการพัฒนา</li>
        <li><strong>ปรับปรุง UI:</strong> ลบ Network Map ออกจากหน้าหลัก เพื่อลดความซับซ้อนของการแสดงผล</li>
        <li><strong>ปรับปรุงการจัดกลุ่ม:</strong> รวมกลุ่มหน่วยงาน (Organizations) เข้าด้วยกัน สำหรับการแสดงผลที่กระชับขึ้น</li>
        <li><strong>ปรับปรุง Sidebar:</strong> นำ Scanner Status Card ออกจาก Sidebar เพื่อเพิ่มพื้นที่แสดงข้อมูลหลัก</li>
        <li><strong>ระบบซิงค์ข้อมูล:</strong> ปรับแต่งระบบ Daily Cron Fetch (ทดสอบเปิด/ปิดการทำงาน)</li>
    </ul>

    <h3>ภาพประกอบ (Illustrations)</h3>
    <div class="logos">
        <!-- Assuming these files exist based on earlier check -->
        <img src="file://${process.cwd().replace(/\\/g, '/')}/frontend/public/logos/eng.png" alt="Engineering Logo" onerror="this.style.display='none'">
        <img src="file://${process.cwd().replace(/\\/g, '/')}/frontend/public/logos/sci.png" alt="Science Logo" onerror="this.style.display='none'">
        <img src="file://${process.cwd().replace(/\\/g, '/')}/frontend/public/logos/med.png" alt="Medicine Logo" onerror="this.style.display='none'">
    </div>
    <div class="caption">รูปภาพโลโก้คณะที่มีการเตรียมไว้ในระบบ</div>

    <div class="progress-container">
        <h3>สถานะความคืบหน้าของระบบ</h3>
        
        <div class="progress-item">
            <div class="progress-label">Frontend Development (Next.js)</div>
            <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: 85%;">85%</div>
            </div>
        </div>
        
        <div class="progress-item">
            <div class="progress-label">Backend API (Express & Prisma)</div>
            <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: 90%;">90%</div>
            </div>
        </div>
        
        <div class="progress-item">
            <div class="progress-label">Data Processing (Python Scripts)</div>
            <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: 75%;">75%</div>
            </div>
        </div>
    </div>

    <div class="footer">
        สร้างเมื่อ: ${new Date().toLocaleDateString('th-TH')}
    </div>
</body>
</html>
`;

async function generatePDF() {
    console.log('Generating PDF with Puppeteer...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Set HTML content
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    await page.pdf({
        path: 'KKU_Scorecard_Progress_Summary.pdf',
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });

    await browser.close();
    console.log('PDF successfully generated at KKU_Scorecard_Progress_Summary.pdf');
}

generatePDF().catch(console.error);
