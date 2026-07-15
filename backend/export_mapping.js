import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

async function main() {
  const domains = await prisma.domain.findMany({
    include: { organization: true },
    orderBy: { domain: "asc" },
  });
  
  const outputPath = "C:\\Users\\juniorboyd\\.gemini\\antigravity-ide\\scratch\\kku-scorecard\\kku_mapping_export.csv";
  
  // Add UTF-8 BOM so xlsx library reads it correctly
  let csv = "\uFEFForgname,url\n";
  for (const d of domains) {
    // Escape quotes and wrap in quotes to be safe
    const org = `"${d.organization.name.replace(/"/g, '""')}"`;
    const dom = `"${d.domain.replace(/"/g, '""')}"`;
    csv += `${org},${dom}\n`;
  }
  
  fs.writeFileSync(outputPath, csv, "utf-8");
  console.log(`Exported ${domains.length} mappings to ${outputPath}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
