import prisma from "./lib/prisma.ts";

async function main() {
  console.log("Searching for Pharmacy organizations...");

  // 1. Find correct organization
  const correctOrg = await prisma.organization.findFirst({
    where: { name: "คณะเภสัชศาสตร์" }
  });

  // 2. Find corrupted organization
  // Since the character is corrupted, we look for names containing "สัชศาสตร์" but not exactly "คณะเภสัชศาสตร์"
  const corruptedOrg = await prisma.organization.findFirst({
    where: {
      name: {
        contains: "สัชศาสตร์"
      },
      NOT: {
        name: "คณะเภสัชศาสตร์"
      }
    }
  });

  if (!correctOrg) {
    console.error("❌ Correct organization 'คณะเภสัชศาสตร์' not found in database.");
    return;
  }

  if (!corruptedOrg) {
    console.error("❌ Corrupted pharmacy organization not found. Already merged?");
    return;
  }

  console.log(`\nFound matching organizations:`);
  console.log(`- Correct Org:   ID ${correctOrg.id} ("${correctOrg.name}")`);
  console.log(`- Corrupted Org: ID ${corruptedOrg.id} ("${corruptedOrg.name}")`);

  console.log("\nMerging domains...");
  const domainsUpdated = await prisma.domain.updateMany({
    where: { organizationId: corruptedOrg.id },
    data: { organizationId: correctOrg.id }
  });
  console.log(`- Moved ${domainsUpdated.count} domains.`);

  console.log("\nMerging issues...");
  const issuesUpdated = await prisma.issue.updateMany({
    where: { organizationId: corruptedOrg.id },
    data: { organizationId: correctOrg.id }
  });
  console.log(`- Moved ${issuesUpdated.count} issues.`);

  console.log("\nHandling daily stats...");
  // Delete corrupted stats to avoid unique constraint violations
  const statsDeleted = await prisma.facultyDailyStat.deleteMany({
    where: { organizationId: corruptedOrg.id }
  });
  console.log(`- Deleted ${statsDeleted.count} stats of the corrupted organization.`);

  console.log("\nDeleting corrupted organization...");
  await prisma.organization.delete({
    where: { id: corruptedOrg.id }
  });
  console.log(`- Deleted corrupted organization ID ${corruptedOrg.id} successfully.`);

  console.log("\n🎉 MERGE PHARMACY SUCCESSFUL!");
}

main().catch(console.error);
