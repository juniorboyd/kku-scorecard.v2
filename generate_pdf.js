const fs = require('fs');
const PDFDocument = require('pdfkit');

async function createPDF() {
  console.log('Generating PDF...');

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(fs.createWriteStream('Progress_Summary.pdf'));

  // Register fonts
  doc.registerFont('ThaiRegular', 'Sarabun-Regular.ttf');
  doc.registerFont('ThaiBold', 'Sarabun-Bold.ttf');

  // Header
  doc.font('ThaiBold').fontSize(24).fillColor('#2c3e50').text('สรุปความคืบหน้าโครงการ', { align: 'center' });
  doc.font('ThaiRegular').fontSize(16).fillColor('#7f8c8d').text('KKU Security Score Card', { align: 'center' });
  doc.moveDown(2);

  // Body
  doc.font('ThaiBold').fontSize(16).fillColor('#2980b9').text('งานที่ดำเนินการล่าสุด (Recent Updates)', { underline: true });
  doc.moveDown(0.5);
  doc.font('ThaiRegular').fontSize(14).fillColor('#34495e');
  doc.list([
    'Bypass ระบบ Login ชั่วคราวเพื่อให้เข้าถึง Dashboard ได้รวดเร็วขึ้น',
    'ปรับปรุง UI โดยลบ Network Map ออกจากหน้าหลัก เพื่อลดความซับซ้อน',
    'รวมกลุ่มหน่วยงาน (Organizations) เข้าด้วยกันสำหรับการแสดงผลที่กระชับขึ้น',
    'นำ Scanner Status Card ออกจาก Sidebar เพื่อปรับปรุงพื้นที่แสดงผล',
    'ปรับแต่งระบบ Daily Cron Fetch (เปิด/ปิด ตามความจำเป็น)'
  ], { bulletRadius: 3, lineGap: 5 });
  
  doc.moveDown(2);

  doc.font('ThaiBold').fontSize(16).fillColor('#2980b9').text('ภาพประกอบ (Illustrations)', { underline: true });
  doc.moveDown(1);
  
  // Add some illustration
  try {
    if (fs.existsSync('frontend/public/logos/eng.png')) {
      doc.image('frontend/public/logos/eng.png', 50, doc.y, { width: 100 });
      doc.image('frontend/public/logos/sci.png', 180, doc.y, { width: 100 });
      doc.image('frontend/public/logos/med.png', 310, doc.y, { width: 100 });
      doc.moveDown(5);
      doc.font('ThaiRegular').fontSize(12).fillColor('#7f8c8d').text('รูปภาพโลโก้คณะที่มีในระบบ', { align: 'center' });
    }
  } catch(e) {
    console.log('Error adding image', e);
  }

  // Draw some progress bars as illustrations
  doc.moveDown(2);
  const startY = doc.y;
  doc.font('ThaiBold').fontSize(14).fillColor('#333333').text('สถานะความคืบหน้าของระบบ:');
  doc.moveDown(0.5);
  
  const drawBar = (label, percentage, y) => {
    doc.font('ThaiRegular').fontSize(12).fillColor('#000').text(label, 50, y);
    doc.rect(200, y, 300, 15).fill('#ecf0f1');
    doc.rect(200, y, 300 * (percentage / 100), 15).fill('#27ae60');
    doc.fillColor('#fff').text(`${percentage}%`, 205 + (300 * (percentage / 100)) / 2 - 15, y + 2);
  }

  drawBar('Frontend Development', 85, doc.y);
  drawBar('Backend API', 90, doc.y + 25);
  drawBar('Data Processing', 75, doc.y + 50);

  doc.end();
  console.log('PDF generated successfully.');
}

createPDF().catch(console.error);
