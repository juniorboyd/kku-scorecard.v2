import prisma from "./lib/prisma.ts";
import { normalizeOrganizationName } from "./utils/textUtils.ts";

async function main() {
  console.log("Syncing issue organization names with the Organization table...");

  const orgs = await prisma.organization.findMany();
  let totalUpdated = 0;

  for (const org of orgs) {
    const result = await prisma.issue.updateMany({
      where: { 
        organizationId: org.id 
      },
      data: {
        organizationName: org.name,
        organizationNameNormalized: normalizeOrganizationName(org.name)
      }
    });
    
    if (result.count > 0) {
      console.log(`- Updated ${result.count} issues to match organization: "${org.name}"`);
      totalUpdated += result.count;
    }
  }

  console.log(`\n🎉 DONE! Synchronized ${totalUpdated} issues in total.`);
}

main().catch(console.error);
