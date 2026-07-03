import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const orgs = await prisma.organization.findMany({
    select: { id: true, name: true }
  });
  console.log("Organizations in DB:", JSON.stringify(orgs, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
