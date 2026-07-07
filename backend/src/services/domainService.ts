import fs from "fs";
import path from "path";
import prisma from "../lib/prisma.ts";
import { parseSpreadsheet, normalizeMappingRow, saveCsvFile, ensureDirectory } from "../utils/fileUtils.ts";
import { normalizeOrganizationName, hasCorruptedUnicode, calculateStringSimilarity } from "../utils/textUtils.ts";
import { TEMP_DIR } from "../config.ts";

export async function getOrganizationsWithDomains() {
  const orgs = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    include: { domains: { orderBy: { domain: "asc" } } },
  });
  return orgs
    .map((o) => ({ ...o, name: normalizeOrganizationName(o.name) }))
    .sort((a, b) => a.name.localeCompare(b.name, "th"));
}

import { getOrgScores } from "./dashboardService.ts";

export async function getOrganizationList(options?: {
  limit?: number; offset?: number; search?: string; importId?: number;
  sortBy?: string; sortOrder?: string;
}) {
  const { limit = 50, offset = 0, search, importId, sortBy = "name", sortOrder = "asc" } = options ?? {};
  const where = search ? { name: { contains: search, mode: "insensitive" as const } } : {};
  const dir: "asc" | "desc" = sortOrder === "asc" ? "asc" : "desc";
  const orderByMap: Record<string, any> = {
    name:    { name: dir },
    domains: { domains: { _count: dir } },
    issues:  { issues: { _count: dir } },
  };
  const orderBy = orderByMap[sortBy] ?? { name: dir };

  const allItems = await prisma.organization.findMany({
    where,
    include: {
      _count: {
        select: {
          domains: true,
          issues: importId ? ({ where: { importId } } as any) : true,
        },
      },
    },
    orderBy: sortBy === "score" ? undefined : orderBy,
  });

  const scores = await getOrgScores({ importId });
  const scoreMap = new Map<string, number>();
  for (const s of scores) {
    scoreMap.set(s.organization.toLowerCase(), s.securityScore);
  }

  const itemsWithScores = allItems.map((item) => {
    const score = scoreMap.get(item.name.toLowerCase()) ?? 100;
    return {
      ...item,
      securityScore: score,
    };
  });

  if (sortBy === "score") {
    itemsWithScores.sort((a, b) => {
      return dir === "asc"
        ? a.securityScore - b.securityScore
        : b.securityScore - a.securityScore;
    });
  }

  const paginatedItems = itemsWithScores.slice(offset, offset + limit);
  const total = itemsWithScores.length;
  return { items: paginatedItems, total };
}

export async function findOrCreateOrganization(name: string) {
  const normalized = normalizeOrganizationName(name);
  if (!normalized) throw new Error("Organization name is required");

  // Case-insensitive match first so "Foo" and "foo" resolve to one org
  // (the name @unique constraint is case-sensitive on its own).
  const existing = await prisma.organization.findFirst({
    where: { name: { equals: normalized, mode: "insensitive" } },
  });
  if (existing) return existing;

  // Atomic insert-or-get: prevents duplicate rows when two requests create the
  // same org name concurrently (the bug the @unique constraint guards against).
  return prisma.organization.upsert({
    where: { name: normalized },
    update: {},
    create: { name: normalized },
  });
}

export async function createOrganization(name: string) {
  const normalized = normalizeOrganizationName(name);
  if (!normalized.trim()) throw new Error("Organization name is required");
  const existing = await prisma.organization.findFirst({
    where: { name: { equals: normalized, mode: "insensitive" } },
  });
  if (existing) return existing;
  return prisma.organization.upsert({
    where: { name: normalized },
    update: {},
    create: { name: normalized },
  });
}

export async function deleteOrganization(id: number) {
  const org = await prisma.organization.findUnique({ where: { id }, include: { _count: { select: { domains: true } } } });
  if (!org) throw new Error("Organization not found");
  if (org._count.domains > 0) throw new Error("Cannot delete organization with domains. Remove domains first.");
  return prisma.organization.delete({ where: { id } });
}

export async function upsertOrganizations(names: string[]) {
  const unique = Array.from(new Set(names.map((n) => normalizeOrganizationName(String(n ?? ""))).filter((n) => n.length > 0)));
  for (const name of unique) {
    await findOrCreateOrganization(name);
  }
}

export async function upsertDomainById(organizationId: number, domain: string) {
  const cleaned = domain.trim().toLowerCase();
  const existing = await prisma.domain.findFirst({ where: { domain: cleaned } });
  if (existing) {
    return prisma.domain.update({
      where: { id: existing.id },
      data: { organizationId },
      include: { organization: true },
    });
  }
  return prisma.domain.create({
    data: { organizationId, domain: cleaned },
    include: { organization: true },
  });
}

export async function assignAndSyncIssues(organizationId: number, domain: string) {
  const domainRecord = await upsertDomainById(organizationId, domain);
  const cleaned = domain.trim().toLowerCase();

  const { count } = await prisma.issue.updateMany({
    where: { OR: [{ host: cleaned }, { matchedDomain: cleaned }] },
    data: {
      organizationId,
      organizationName: domainRecord.organization.name,
      organizationNameNormalized: normalizeOrganizationName(domainRecord.organization.name),
      matchedDomain: cleaned,
    },
  });

  return { domain: domainRecord, updatedIssueCount: count };
}

export async function createDomainMapping(orgName: string, domain: string) {
  const normalized = normalizeOrganizationName(orgName);
  const org = await findOrCreateOrganization(normalized);
  return prisma.domain.create({ data: { organizationId: org.id, domain: domain.trim().toLowerCase() } });
}

export async function updateDomainMapping(id: number, data: { domain?: string; organizationName?: string }) {
  const update: { domain?: string; organizationId?: number } = {};
  if (data.domain) update.domain = data.domain.trim().toLowerCase();
  if (data.organizationName) {
    const org = await findOrCreateOrganization(data.organizationName);
    update.organizationId = org.id;
  }
  return prisma.domain.update({ where: { id }, data: update });
}

export async function deleteDomainMapping(id: number) {
  return prisma.domain.delete({ where: { id } });
}

export async function writeMasterDomainCsv(outputPath: string): Promise<string> {
  ensureDirectory(path.dirname(outputPath));
  const domains = await prisma.domain.findMany({
    include: { organization: true },
    orderBy: { domain: "asc" },
  });
  // Always write the correct headers so Python can read the file even when the domain table is empty.
  const COL_ORG = "เว็บไซต์ของส่วนงาน(คณะ/วิทยาลัย/สำนัก)";
  const COL_URL = "URL ของเว็บไซต์";
  const rows = domains.map((d) => ({ [COL_ORG]: d.organization.name, [COL_URL]: d.domain }));
  if (rows.length === 0) {
    fs.writeFileSync(outputPath, `${COL_ORG},${COL_URL}\n`, "utf-8");
  } else {
    saveCsvFile(rows, outputPath);
  }
  return outputPath;
}

export async function importMappingFile(filePath: string) {
  const rows = parseSpreadsheet(filePath);
  let created = 0, skipped = 0, errors: string[] = [];

  for (const row of rows) {
    const { orgName, domain } = normalizeMappingRow(row);
    if (!orgName || !domain) { skipped++; continue; }
    try {
      const org = await findOrCreateOrganization(orgName);
      const existing = await prisma.domain.findUnique({ where: { domain } });
      if (!existing) {
        await prisma.domain.create({ data: { organizationId: org.id, domain } });
        created++;
      } else {
        if (existing.organizationId !== org.id) {
          await prisma.domain.update({ where: { id: existing.id }, data: { organizationId: org.id } });
          created++; // Count as updated
        } else {
          skipped++;
        }
      }
    } catch (e: any) {
      errors.push(`${domain}: ${e.message}`);
    }
  }
  return { created, skipped, errors };
}

export async function mergeCorruptedOrganizations() {
  const report = { analyzed: 0, corrupted: 0, merged: 0, domainsReassigned: 0, issuesReassigned: 0, details: [] as any[] };
  const allOrgs = await prisma.organization.findMany({ include: { domains: true } });
  report.analyzed = allOrgs.length;

  for (const org of allOrgs.filter((o) => hasCorruptedUnicode(o.name))) {
    const normalized = normalizeOrganizationName(org.name);
    let clean = allOrgs.find((o) => o.id !== org.id && o.name === normalized && !hasCorruptedUnicode(o.name));

    if (!clean) {
      let best: typeof allOrgs[0] | undefined;
      let bestScore = 0;
      for (const o of allOrgs) {
        if (o.id === org.id || hasCorruptedUnicode(o.name)) continue;
        const score = calculateStringSimilarity(normalized, o.name);
        if (score > bestScore && score >= 85) { best = o; bestScore = score; }
      }
      clean = best;
    }

    if (clean) {
      const { count: issuesMoved } = await prisma.issue.updateMany({
        where: { organizationId: org.id },
        data: {
          organizationId: clean.id,
          organizationName: clean.name,
          organizationNameNormalized: normalizeOrganizationName(clean.name),
        },
      });
      await prisma.domain.updateMany({ where: { organizationId: org.id }, data: { organizationId: clean.id } });
      await prisma.organization.delete({ where: { id: org.id } });
      report.corrupted++;
      report.merged++;
      report.domainsReassigned += org.domains.length;
      report.issuesReassigned += issuesMoved;
      report.details.push({ corruptedId: org.id, corruptedName: org.name, cleanId: clean.id, cleanName: clean.name, domainsMerged: org.domains.length, issuesMoved });
    }
  }
  return report;
}
