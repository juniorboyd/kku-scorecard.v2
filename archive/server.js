const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ป้อน API Token ของ SecurityScorecard ตรงนี้ หรือรันผ่าน Environment Variable (เช่น SSC_API_TOKEN=your_token npm start)
const SSC_API_TOKEN = process.env.SSC_API_TOKEN || ''; 

app.use(cors());
app.use(express.static(path.join(__dirname)));

// Endpoint ดึงข้อมูลจาก SecurityScorecard API
app.get('/api/scorecard', async (req, res) => {
  const domain = req.query.domain || 'kku.ac.th';
  
  if (!SSC_API_TOKEN) {
    // หากไม่มี Token ให้ส่งข้อมูลจำลองกลับไปตามปกติ เพื่อป้องกันโปรแกรมพัง
    return res.json({
      source: 'mock',
      domain: domain,
      score: 82,
      grade: 'B',
      categories: [
        { id: 'network', score: 85, grade: 'B' },
        { id: 'patch', score: 68, grade: 'D' },
        { id: 'appsec', score: 79, grade: 'C' },
        { id: 'dns', score: 96, grade: 'A' }
      ],
      message: 'รันเซิร์ฟเวอร์แบบจำลอง (Mock Mode) เนื่องจากไม่พบ API Token. หากต้องการดึงข้อมูลจริงโปรดกำหนด SSC_API_TOKEN'
    });
  }

  try {
    // 1. ดึงข้อมูลประวัติบริษัท / คะแนนรวม
    const response = await fetch(`https://api.securityscorecard.io/companies/${domain}`, {
      headers: {
        'Authorization': `Token ${SSC_API_TOKEN}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`SecurityScorecard API ตอบกลับด้วยสถานะ: ${response.status}`);
    }

    const data = await response.json();
    
    // 2. ดึงข้อมูลคะแนนรายหมวดหมู่ (Factors)
    const factorsResponse = await fetch(`https://api.securityscorecard.io/companies/${domain}/factors`, {
      headers: {
        'Authorization': `Token ${SSC_API_TOKEN}`,
        'Accept': 'application/json'
      }
    });
    
    let factorsData = { entries: [] };
    if (factorsResponse.ok) {
      factorsData = await factorsResponse.json();
    }

    // แมปชื่อหมวดหมู่ของ SecurityScorecard เข้ากับ UI ของเรา
    const factorMap = {
      'network_security': 'network',
      'patching_cadence': 'patch',
      'application_security': 'appsec',
      'dns_health': 'dns'
    };

    const categories = (factorsData.entries || []).map(f => {
      // คะแนนปัจจัยของ SecurityScorecard จะเป็นทศนิยม 0.0 - 1.0
      const score = Math.round((f.score || 0) * 100);
      return {
        id: factorMap[f.name] || f.name,
        name: f.name,
        score: score,
        grade: getGradeFromScore(score)
      };
    });

    res.json({
      source: 'real_api',
      domain: domain,
      score: data.score,
      grade: data.grade,
      categories: categories,
      raw: data
    });

  } catch (error) {
    console.error('Error fetching SecurityScorecard API:', error);
    res.status(500).json({ error: error.message, note: 'เกิดข้อผิดพลาดในการเชื่อมต่อ API' });
  }
});

function getGradeFromScore(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

app.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`  Security Scorecard Server is running at http://localhost:${PORT}`);
  console.log(`================================================================`);
  if (!SSC_API_TOKEN) {
    console.log(`[INFO] รันด้วยข้อมูลจำลอง (Mock Mode)`);
    console.log(`[TIPS] หากต้องการเชื่อมข้อมูลจริง โปรดรันด้วยคำสั่ง:`);
    console.log(`       Windows PowerShell: $env:SSC_API_TOKEN="your_key"; node server.js`);
  } else {
    console.log(`[OK] เชื่อมต่อระบบ API Token เรียบร้อยแล้ว`);
  }
});
