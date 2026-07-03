import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const latestImport = await prisma.import.findFirst({
    where: { status: "success" },
    orderBy: { snapshotDate: "desc" },
    select: { id: true }
  });
  if (!latestImport) {
    console.log("No successful imports found.");
    return;
  }
  const severityBreakdown = await prisma.issue.groupBy({
    by: ["severity"],
    where: { importId: latestImport.id },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } }
  });
  console.log("Severity Breakdown in DB:", JSON.stringify(severityBreakdown, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
