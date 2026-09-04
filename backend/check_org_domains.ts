import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany({
    include: { _count: { select: { domains: true, issues: true } } }
  });
  
  const target = orgs.find(o => o.name.includes('เทคโนโลยี'));
  console.log('Found org:', target);
}

main().catch(console.error).finally(() => prisma.$disconnect());
