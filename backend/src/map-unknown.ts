import prisma from "./lib/prisma.ts";

async function main() {
  console.log("Starting mapping of 'unknown' organizations to 'สำนักงานอธิการบดี'...");

  // 1. Find the target organization
  const targetOrg = await prisma.organization.findFirst({
    where: { name: "สำนักงานอธิการบดี" }
  });

  if (!targetOrg) {
    console.error("❌ Target organization 'สำนักงานอธิการบดี' not found in database.");
    return;
  }

  console.log(`Found target organization: ID ${targetOrg.id} ("${targetOrg.name}")`);

  // 2. Update issues
  console.log("\nUpdating issues...");
  const issuesUpdated = await prisma.issue.updateMany({
    where: {
      OR: [
        { organizationName: "unknown" },
        { organizationId: null }
      ]
    },
    data: {
      organizationId: targetOrg.id,
      organizationName: targetOrg.name,
      organizationNameNormalized: "สำนักงานอธิการบดี"
    }
  });

  console.log(`- Updated ${issuesUpdated.count} issues from 'unknown' to 'สำนักงานอธิการบดี'.`);

  console.log("\n🎉 MAPPING COMPLETED SUCCESSFULLY!");
}

main().catch(console.error);
