import { startFetchJob } from "./src/services/importService.ts";
import prisma from "./src/lib/prisma.ts";

async function main() {
  console.log("Starting manual fetch job...");
  const importId = await startFetchJob("manualFetch", 1);
  console.log("Fetch job started! Import ID:", importId);
  
  let status = "pending";
  for (let i = 0; i < 60; i++) {
    const record = await prisma.import.findUnique({ where: { id: importId } });
    status = record.status;
    console.log(`Checking status... (${i+1}/60): ${status}`);
    if (status === "success" || status === "failed") {
      if (status === "failed") {
        console.error("Import failed with error:", record.errorMessage);
      }
      break;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
