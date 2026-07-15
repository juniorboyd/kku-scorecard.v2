import prisma from '../src/lib/prisma.ts';

async function main() {
  console.log("Checking for corrupted organization names...");
  const orgs = await prisma.organization.findMany();
  for (let o of orgs) {
    let n = o.name;
    if (n.includes('คณะเ') && n.includes('สัชศาสตร์')) {
      n = 'คณะเภสัชศาสตร์';
    }
    if (n.includes('สถาบัน') && n.includes('าษา')) {
      n = 'สถาบันภาษา';
    }
    if (n.includes('สำนักงานส') && n.includes('ามหาวิทยาลัย')) {
      n = 'สำนักงานสภามหาวิทยาลัย';
    }
    if (n !== o.name) {
      console.log('Fixing:', o.name, '->', n);
      await prisma.organization.update({
        where: { id: o.id },
        data: { name: n }
      });
      // Also update Issues related to this org to fix the duplicated string
      await prisma.issue.updateMany({
        where: { organizationId: o.id },
        data: { organizationName: n }
      });
    }
  }
  console.log("Done fixing organization names.");
}
main();
