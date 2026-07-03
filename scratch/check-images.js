const fs = require('fs');
const path = require('path');

const files = ['bus.png', 'human.png', 'gs.png', 'med.png', 'sci.png', 'eng.png'];
const dir = path.join(__dirname, '..', 'frontend', 'public', 'logos');

files.forEach(f => {
  const p = path.join(dir, f);
  if (fs.existsSync(p)) {
    const stats = fs.statSync(p);
    console.log(`${f}: exists, size = ${stats.size} bytes`);
  } else {
    console.log(`${f}: DOES NOT EXIST`);
  }
});
