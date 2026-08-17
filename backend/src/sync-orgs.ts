import axios from "axios";
import prisma from "./lib/prisma.ts";

async function main() {
  const args = process.argv.slice(2);
  const token = args[0];

  if (!token) {
    console.error("Usage: node dist/sync-orgs.js <NOC_API_KEY>");
    process.exit(1);
  }

  const API_URL = "https://noc.kku.ac.th/api/public/organizations";
  console.log(`Syncing organizations from ${API_URL}...`);

  try {
    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const externalOrgs = response.data.items;
    if (!Array.isArray(externalOrgs)) {
      throw new Error("Invalid response format: items is not an array");
    }

    console.log(`Found ${externalOrgs.length} organizations from NOC API.`);
    if (externalOrgs.length > 0) {
      console.log("Sample organization from API:", JSON.stringify(externalOrgs[0], null, 2));
    }
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const org of externalOrgs) {
      const orgId = Number(org.id);
      if (isNaN(orgId)) {
        skippedCount++;
        continue;
      }

      const orgName = org.name || `Organization ${orgId}`;

      // Upsert into Organization table
      const existing = await prisma.organization.findUnique({
        where: { id: orgId }
      });

      if (existing) {
        await prisma.organization.update({
          where: { id: orgId },
          data: { name: orgName }
        });
        updatedCount++;
      } else {
        await prisma.organization.create({
          data: {
            id: orgId,
            name: orgName
          }
        });
        createdCount++;
      }
    }

    console.log(`\n🎉 SYNC COMPLETED SUCCESSFULLY!`);
    console.log(`- Created: ${createdCount} organizations`);
    console.log(`- Updated: ${updatedCount} organizations`);
    console.log(`- Skipped (invalid ID): ${skippedCount} organizations`);

  } catch (error: any) {
    console.error("❌ Sync failed:");
    if (error.response) {
      console.error(`- HTTP Status: ${error.response.status}`);
      console.error("- Response Data:", error.response.data);
    } else {
      console.error("- Error Message:", error.message);
    }
    process.exit(1);
  }
}

main().catch(console.error);
