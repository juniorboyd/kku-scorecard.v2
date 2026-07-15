import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const issues = await prisma.issue.findMany({
    where: {
      OR: [
        { organizationId: null },
        { organizationName: null },
        { organizationName: 'unassigned' }
      ]
    },
    select: {
      matchedDomain: true,
      host: true
    },
    distinct: ['matchedDomain', 'host']
  });

  const domains = new Set<string>();
  issues.forEach(i => {
    if (i.matchedDomain) domains.add(i.matchedDomain);
    if (i.host) domains.add(i.host);
  });

  console.log(Array.from(domains).filter(Boolean).join('\n'));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
