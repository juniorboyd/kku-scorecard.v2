import prisma from "./lib/prisma.ts";

async function mergeOrgs(correctName: string, searchPattern: { prefix: string; suffix: string }) {
  console.log(`\n--- Merging for: ${correctName} ---`);

  // 1. Find correct organization
  const correctOrg = await prisma.organization.findUnique({
    where: { name: correctName }
  });

  if (!correctOrg) {
    console.error(`❌ Correct organization '${correctName}' not found in database.`);
    return;
  }

  // 2. Find corrupted organization
  const allOrgs = await prisma.organization.findMany();
  const corruptedOrg = allOrgs.find(org => 
    org.name.startsWith(searchPattern.prefix) && 
    org.name.endsWith(searchPattern.suffix) && 
    org.name !== correctName
  );

  if (!corruptedOrg) {
    console.error(`❌ Corrupted organization matching ${searchPattern.prefix}...${searchPattern.suffix} not found. Already merged?`);
    return;
  }

  console.log(`Found matching organizations:`);
  console.log(`- Correct Org:   ID ${correctOrg.id} ("${correctOrg.name}")`);
  console.log(`- Corrupted Org: ID ${corruptedOrg.id} ("${corruptedOrg.name}")`);

  // Move domains
  const domainsUpdated = await prisma.domain.updateMany({
    where: { organizationId: corruptedOrg.id },
    data: { organizationId: correctOrg.id }
  });
  console.log(`- Moved ${domainsUpdated.count} domains.`);

  // Move issues
  const issuesUpdated = await prisma.issue.updateMany({
    where: { organizationId: corruptedOrg.id },
    data: { organizationId: correctOrg.id }
  });
  console.log(`- Moved ${issuesUpdated.count} issues.`);

  // Delete stats of corrupted org
  const statsDeleted = await prisma.facultyDailyStat.deleteMany({
    where: { organizationId: corruptedOrg.id }
  });
  console.log(`- Deleted ${statsDeleted.count} stats of the corrupted organization.`);

  // Delete corrupted org record
  await prisma.organization.delete({
    where: { id: corruptedOrg.id }
  });
  console.log(`- Deleted corrupted organization ID ${corruptedOrg.id} successfully.`);
}

async function main() {
  // Merge สำนักงานสภามหาวิทยาลัย
  await mergeOrgs("สำนักงานสภามหาวิทยาลัย", {
    prefix: "สำนักงานส",
    suffix: "ามหาวิทยาลัย"
  });

  // Merge สถาบันภาษา
  await mergeOrgs("สถาบันภาษา", {
    prefix: "สถาบัน",
    suffix: "าษา"
  });

  console.log("\n🎉 ALL MERGES COMPLETED SUCCESSFULLY!");
}

main().catch(console.error);
