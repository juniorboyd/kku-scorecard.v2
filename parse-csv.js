const fs = require('fs');
const readline = require('readline');

async function main() {
  const filePath = 'c:\\Users\\juniorboyd\\.gemini\\antigravity-ide\\scratch\\kku-scorecard\\data\\uploads\\securityscorecard-cron-api-2026-07-07T01-58-08-227Z.csv';
  
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const uniqueIssues = new Set();
  let header = null;

  for await (const line of rl) {
    // Basic CSV parser
    const parts = line.split(',');
    if (!header) {
      header = parts.map(p => p.replace(/"/g, '').trim());
      continue;
    }

    // Find the index of "ISSUE TYPE TITLE" or similar
    // SecurityScorecard CSV header typically contains "Issue Type" or "Issue Type Title"
    // Let's find columns:
    const issueTypeIdx = header.findIndex(h => h.toLowerCase().includes('issue type title') || h.toLowerCase() === 'issue type');
    if (issueTypeIdx !== -1 && parts[issueTypeIdx]) {
      uniqueIssues.add(parts[issueTypeIdx].replace(/"/g, '').trim());
    }
  }

  console.log("Distinct Issues found in CSV:");
  Array.from(uniqueIssues).sort().forEach(issue => console.log(`- ${issue}`));
}

main().catch(console.error);
