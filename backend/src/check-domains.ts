import prisma from "./lib/prisma.ts";

async function main() {
  console.log("Checking Domain table mapping status...");

  const totalDomains = await prisma.domain.count();
  console.log(`Total domains in database: ${totalDomains}`);

  const sampleDomains = await prisma.domain.findMany({
    take: 10,
    include: { organization: true }
  });

  console.log("\nSample domains in database:");
  for (const d of sampleDomains) {
    console.log(`- Domain: "${d.domain}" -> Org ID: ${d.organizationId} ("${d.organization.name}")`);
  }

  // Count domains per organization
  const domainCounts = await prisma.domain.groupBy({
    by: ["organizationId"],
    _count: { id: true }
  });

  console.log("\nDomain counts per Organization ID:");
  for (const group of domainCounts) {
    const org = await prisma.organization.findUnique({ where: { id: group.organizationId } });
    console.log(`- Org ID: ${group.organizationId} ("${org?.name ?? 'UNKNOWN'}"): ${group._count.id} domains`);
  }
}

main().catch(console.error);
