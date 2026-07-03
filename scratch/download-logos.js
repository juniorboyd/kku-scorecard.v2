const fs = require('fs');
const path = require('path');

const faculties = [
  { id: 'med', url: 'https://upload.wikimedia.org/wikipedia/en/c/ca/Logo_of_Faculty_of_Medicine_Khon_Kaen.png' },
  { id: 'computing', url: 'https://computing.kku.ac.th/wp-content/uploads/2023/12/logo-computing-kku.png' },
  { id: 'eng', url: 'https://www.en.kku.ac.th/web/wp-content/uploads/2025/06/LOGO_ENkku_color.png' },
  { id: 'law', url: 'https://law.kku.ac.th/law2021/images/logo-law-kku.png' },
  { id: 'sci', url: 'https://sc.kku.ac.th/wp-content/uploads/2024/01/SCKKULOGO_update2018THAI-2.png' },
  { id: 'dent', url: 'https://dentistry.kku.ac.th/dentistry2022/images/logo-dent-kku.png' },
  { id: 'pharm', url: 'https://pharmacy.kku.ac.th/images/logo-pharm-kku.png' },
  { id: 'ams', url: 'https://ams.kku.ac.th/ams2021/images/logo-ams-kku.png' },
  { id: 'econ', url: 'https://econ.kku.ac.th/econ2021/images/logo-econ-kku.png' },
  { id: 'nu', url: 'https://nu.kku.ac.th/nu2021/images/logo-nu-kku.png' },
  { id: 'arch', url: 'https://arch.kku.ac.th/arch2021/images/logo-arch-kku.png' },
  { id: 'tech', url: 'https://te.kku.ac.th/te2021/images/logo-te-kku.png' },
  { id: 'ph', url: 'https://ph.kku.ac.th/ph2021/images/logo-ph-kku.png' },
  { id: 'fa', url: 'https://fa.kku.ac.th/fa2021/images/logo-fa-kku.png' },
  { id: 'vet', url: 'https://vet.kku.ac.th/vet2021/images/logo-vet-kku.png' },
  { id: 'is', url: 'https://is.kku.ac.th/is2021/images/logo-is-kku.png' },
  { id: 'ag', url: 'https://ag.kku.ac.th/ag2021/images/logo-ag-kku.png' },
  { id: 'edu', url: 'https://edu.kku.ac.th/edu2021/images/logo-edu-kku.png' }
];

const destDir = path.join(__dirname, '..', 'frontend', 'public', 'logos');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

async function download(id, url) {
  const ext = path.extname(new URL(url).pathname) || '.png';
  const dest = path.join(destDir, `${id}${ext}`);
  console.log(`Downloading ${id} from ${url}...`);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buffer);
    console.log(`Saved ${id} successfully!`);
    return true;
  } catch (err) {
    console.error(`Failed to download ${id}: ${err.message}`);
    return false;
  }
}

async function run() {
  for (const f of faculties) {
    await download(f.id, f.url);
  }
}

run();
