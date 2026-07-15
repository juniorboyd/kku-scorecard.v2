const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const orgs = await prisma.organization.findMany({ take: 5 });
  console.log(orgs);
}
main().catch(console.error).finally(() => prisma.$disconnect());
