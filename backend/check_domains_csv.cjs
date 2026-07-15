const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function matchOrgFromHostname(hostname) {
  const nameStr = (hostname || "").toLowerCase();
  const tokens = nameStr.split(/[^a-z0-9]/);
  const hasToken = (t) => tokens.includes(t);
  const hasPrefix = (prefix) => tokens.some(t => t.startsWith(prefix));

  if (hasToken("med") || hasToken("md") || hasToken("medicine") || hasToken("smd") || hasPrefix("smd")) return "คณะแพทยศาสตร์";
  if (hasToken("vet") || hasToken("vm") || hasPrefix("vet")) return "คณะสัตวแพทยศาสตร์";
  if (hasToken("eng") || hasToken("enit") || hasPrefix("eng")) return "คณะวิศวกรรมศาสตร์";
  if (hasToken("sci") || hasToken("sc") || hasPrefix("sci") || hasToken("scipark")) return "คณะวิทยาศาสตร์";
  if (hasToken("edu") || hasToken("ed") || hasPrefix("edu")) return "คณะศึกษาศาสตร์";
  if (hasToken("gs") || hasToken("grad")) return "บัณฑิตวิทยาลัย";
  if (hasToken("huso")) return "คณะมนุษยศาสตร์และสังคมศาสตร์";
  if (hasToken("kkbs") || hasToken("bus") || hasToken("business")) return "คณะบริหารธุรกิจและการบัญชี";
  if (hasToken("ams")) return "คณะเทคนิคการแพทย์";
  if (hasToken("econ") || hasToken("economy")) return "คณะเศรษฐศาสตร์";
  if (hasToken("arch") || hasToken("ar") || hasToken("architecture")) return "คณะสถาปัตยกรรมศาสตร์";
  if (hasToken("dent") || hasPrefix("dent")) return "คณะทันตแพทยศาสตร์";
  if (hasToken("computing") || hasToken("cp")) return "วิทยาลัยการคอมพิวเตอร์";
  if (hasToken("is") || hasToken("nongkhai") || hasToken("nk")) return "คณะสหวิทยาการ มข. (หนองคาย)";
  if (hasToken("ph") || hasToken("publichealth")) return "คณะสาธารณสุขศาสตร์";
  if (hasToken("fa") || hasToken("finearts")) return "คณะศิลปกรรมศาสตร์";
  if (hasToken("pharm") || hasToken("ps") || hasPrefix("pharm")) return "คณะเภสัชศาสตร์";
  if (hasToken("ag") || hasToken("agri") || hasPrefix("agri") || hasToken("agriculture")) return "คณะเกษตรศาสตร์";
  if (hasToken("law") || hasToken("lw")) return "คณะนิติศาสตร์";
  if (hasToken("te") || hasToken("tech") || hasPrefix("tech") || hasToken("technology")) return "คณะเทคโนโลยี";
  if (hasToken("nu") || hasToken("nurs") || hasPrefix("nurs") || hasToken("nursing")) return "คณะพยาบาลศาสตร์";
  return undefined;
}

function cleanHost(url) {
  if (!url) return null;
  let text = String(url).toLowerCase().trim();
  text = text.replace(/และ|go to:|goto:|link:|ลิ้ง|ลิงค์|เว็บไซต์|เข้า:|เข้าที่|ไปที่|ดูที่/g, "");
  text = text.replace(/^["'()\[\]<>.,]+|["'()\[\]<>.,]+$/g, "");
  text = text.replace("https//", "https://").replace("http//", "http://").replace("hxxps://", "https://").replace("hxxp://", "http://");
  if (!text.startsWith("http")) text = "http://" + text;
  
  try {
    const parsed = new URL(text);
    let host = parsed.hostname || text;
    host = host.replace("www.", "").split(":")[0].replace(/\/$/, "");
    return host;
  } catch(e) {
    return text.replace("http://", "").replace("www.", "").split(":")[0].replace(/\/$/, "");
  }
}

async function main() {
  const csvFile = "C:\\Users\\juniorboyd\\.gemini\\antigravity-ide\\scratch\\kku-scorecard\\backend\\data\\uploads\\securityscorecard-cron-api-2026-06-26T06-13-05-872Z.csv";
  const content = fs.readFileSync(csvFile, 'utf8');
  const lines = content.split('\n');
  
  const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
  const urlCols = ['FINAL URL', 'INITIAL URL', 'HOSTNAME', 'SUBDOMAIN', 'TARGET', 'IP ADDRESSES'];
  const colIndices = urlCols.map(c => headers.indexOf(c));
  
  const uniqueDomains = new Set();
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    // Simple csv parse
    let row = [];
    let inQuotes = false;
    let curr = '';
    for (let c of lines[i]) {
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        row.push(curr);
        curr = '';
      } else {
        curr += c;
      }
    }
    row.push(curr);
    
    let host = null;
    for (let idx of colIndices) {
      if (idx !== -1 && row[idx] && row[idx].trim()) {
        host = cleanHost(row[idx]);
        if (host) break;
      }
    }
    if (host) uniqueDomains.add(host);
  }
  
  const domainsInDb = await prisma.domain.findMany({ select: { domain: true } });
  const mappedDomains = new Set(domainsInDb.map(d => d.domain.toLowerCase()));
  
  let unassigned = [];
  for (let d of uniqueDomains) {
    if (!mappedDomains.has(d.toLowerCase())) {
      unassigned.push(d);
    }
  }
  
  console.log(`Found ${uniqueDomains.size} total domains from CSV.`);
  console.log(`Found ${unassigned.length} UNASSIGNED domains (not in DB).`);
  
  let guessed = {};
  let unknown = [];
  for (let d of unassigned) {
    const org = matchOrgFromHostname(d);
    if (org) {
      if(!guessed[org]) guessed[org] = [];
      guessed[org].push(d);
    } else {
      unknown.push(d);
    }
  }
  
  console.log(`\nI can auto-detect the faculty for ${unassigned.length - unknown.length} domains!`);
  for (let [org, domains] of Object.entries(guessed)) {
    console.log(`\n${org}:`);
    domains.forEach(d => console.log(`  - ${d}`));
  }
  
  console.log(`\nCouldn't guess:`);
  unknown.forEach(d => console.log(`  - ${d}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
