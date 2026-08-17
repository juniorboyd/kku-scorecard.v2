import prisma from "./lib/prisma.ts";

async function main() {
  console.log("Listing distinct issue types in database...");

  const distinctIssues = await prisma.issue.findMany({
    select: { issueTypeTitle: true, factorName: true },
    distinct: ["issueTypeTitle"],
    orderBy: { issueTypeTitle: "asc" }
  });

  console.log(`\nFound ${distinctIssues.length} distinct issue types:`);
  for (const issue of distinctIssues) {
    console.log(`- [${issue.factorName}] "${issue.issueTypeTitle}"`);
  }
}

main().catch(console.error);
