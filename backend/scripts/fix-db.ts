import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function fixMojibake(text: string): string {
  try {
    // If it looks like UTF-8 bytes read as ISO-8859-1
    if (text.includes('à¸') || text.includes('à¹')) {
      return Buffer.from(text, 'binary').toString('utf8');
    }
  } catch (e) {
    // ignore
  }
  return text;
}

async function main() {
  console.log("Starting database encoding fix...");
  
  const orgs = await prisma.organization.findMany();
  let count = 0;
  for (const org of orgs) {
    const fixedName = fixMojibake(org.name);
    if (fixedName !== org.name) {
      console.log(`Fixing: ${org.name} -> ${fixedName}`);
      await prisma.organization.update({
        where: { id: org.id },
        data: { name: fixedName }
      });
      count++;
    }
  }
  console.log(`Fixed ${count} organizations.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
