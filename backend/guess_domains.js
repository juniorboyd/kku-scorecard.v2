import { PrismaClient } from "@prisma/client";

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

async function main() {
  const issues = await prisma.issue.findMany({
    where: { organizationId: null },
    select: { host: true, matchedDomain: true }
  });

  const uniqueDomains = new Set();
  issues.forEach(i => {
    if (i.host) uniqueDomains.add(i.host);
    if (i.matchedDomain) uniqueDomains.add(i.matchedDomain);
  });

  console.log(`Found ${uniqueDomains.size} unassigned domains/hosts in the local DB.`);

  let guessed = 0;
  for (const domain of uniqueDomains) {
    const org = matchOrgFromHostname(domain);
    if (org) {
      console.log(`- ${domain} => ${org}`);
      guessed++;
    } else {
      console.log(`- ${domain} => (Unknown)`);
    }
  }
  
  console.log(`\nGuessed ${guessed} out of ${uniqueDomains.size} domains.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
