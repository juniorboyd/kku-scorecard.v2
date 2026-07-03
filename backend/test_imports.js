import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const imports = await prisma.import.findMany({
    orderBy: { snapshotDate: "desc" }
  });
  console.log("Imports in DB:", JSON.stringify(imports, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
