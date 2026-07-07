import { basename, resolve } from "path";
import fs from "fs";
import prisma from "../lib/prisma.ts";
import { SSC_API_URL, SSC_API_KEY_HEADER, SSC_COMPANY_DOMAIN, UPLOAD_DIR, TEMP_DIR, DATA_DIR } from "../config.ts";
import { ensureDirectory } from "../utils/fileUtils.ts";
import { normalizeOrganizationName, matchOrgFromHostname } from "../utils/textUtils.ts";
import { runPythonProcessor } from "../lib/pythonRunner.ts";
import { getScorecardApiKey } from "./settingsService.ts";
import { writeMasterDomainCsv, findOrCreateOrganization } from "./domainService.ts";
import axios from "axios";

ensureDirectory(DATA_DIR);
ensureDirectory(UPLOAD_DIR);
ensureDirectory(TEMP_DIR);

function buildTimestampedPath(prefix: string, ext: string) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  return resolve(UPLOAD_DIR, `${prefix}-${ts}.${ext}`);
}

async function buildMasterFile() {
  return writeMasterDomainCsv(resolve(TEMP_DIR, `master-${Date.now()}.csv`));
}

function getSscBaseUrl() {
  if (!SSC_API_URL) return "https://api.securityscorecard.io";
  try { return new URL(SSC_API_URL).origin; } catch { return "https://api.securityscorecard.io"; }
}

async function sscHeaders() {
  const key = await getScorecardApiKey();
  if (!key) throw new Error("SecurityScorecard API key not configured");
  return { accept: "application/json; charset=utf-8", [SSC_API_KEY_HEADER]: `Token ${key}` };
}

async function createSscReport(domain: string): Promise<string> {
  const url = `${getSscBaseUrl()}/reports/issues`;
  const r = await axios.post(url, { format: "csv", scorecard_identifier: domain }, {
    headers: { ...(await sscHeaders()), "Content-Type": "application/json" },
    timeout: 60000,
  });
  if (!r.data?.id) throw new Error("Failed to create SSC report");
  return String(r.data.id);
}

async function waitForReport(reportId: string): Promise<string> {
  const url = `${getSscBaseUrl()}/reports/recent`;
  const headers = await sscHeaders();
  for (let i = 1; i <= 30; i++) {
    const r = await axios.get(url, { headers, timeout: 60000 });
    const entries = Array.isArray(r.data?.entries) ? r.data.entries : [];
    const match = entries.find((e: any) => String(e.id) === reportId);
    if (match?.completed_at && match?.download_url) return String(match.download_url);
    console.log(`[SSC] Report pending... attempt ${i}/30`);
    await new Promise((res) => setTimeout(res, 60000));
  }
  throw new Error(`Report generation timed out: ${reportId}`);
}

async function downloadCsv(url: string): Promise<string> {
  const r = await axios.get(url, { responseType: "text", headers: await sscHeaders(), timeout: 60000 });
  return r.data;
}

export async function createImportRecord(opts: {
  filePath: string; source: string; fileName?: string;
  snapshotDate?: string; note?: string; importMode?: string; uploadedById?: number;
}) {
  const snapshotDateObj = opts.snapshotDate ? new Date(opts.snapshotDate) : new Date();
  return prisma.import.create({
    data: {
      importDate: snapshotDateObj,
      snapshotDate: snapshotDateObj,
      uploadedAt: new Date(),
      uploadedById: opts.uploadedById ?? null,
      importMode: opts.importMode ?? "create",
      note: opts.note ?? null,
      source: opts.source,
      fileName: opts.fileName,
      status: "pending",
      rawPath: opts.filePath,
      totalIssues: 0,
    },
  });
}

export async function processSecurityScorecardUpload(opts: {
  filePath: string; source: string; fileName?: string;
  snapshotDate?: string; note?: string; importMode?: string;
  uploadedById?: number; existingImportId?: number;
}) {
  const masterPath = await buildMasterFile();
  let importRecord;

  if (opts.existingImportId) {
    const existing = await prisma.import.findUnique({ where: { id: opts.existingImportId } });
    if (!existing) throw new Error(`Import not found: ${opts.existingImportId}`);
    importRecord = existing;
  } else {
    importRecord = await createImportRecord(opts);
  }

  try {
    await prisma.import.update({
      where: { id: importRecord.id },
      data: { status: "processing", errorMessage: null },
    });

    if (opts.existingImportId) {
      await prisma.issue.deleteMany({ where: { importId: opts.existingImportId } });
    }

    const result = await runPythonProcessor(opts.filePath, masterPath);

    // Pre-load all orgs from DB. Org names are the source of truth from the DB (xlsx upload).
    // Python-supplied org names are matched by exact case-insensitive lookup only — no new orgs created.
    const dbOrgs = await prisma.organization.findMany({ select: { id: true, name: true } });
    const orgByName = new Map<string, { id: number; name: string }>();
    for (const o of dbOrgs) orgByName.set(o.name.trim().toLowerCase(), { id: o.id, name: o.name });

    // Pre-pass: auto-detect missing organizations sequentially to avoid race conditions
    for (const row of result.raw_result) {
      let rawOrg = String(row.Organization ?? "").trim();
      let match = (rawOrg && rawOrg !== "unknown" && rawOrg !== "no data") ? orgByName.get(rawOrg.toLowerCase()) : undefined;
      
      if (!match) {
        const matchedDomain = String(row.matched_domain ?? "");
        const host = row.asset_host ? String(row.asset_host).trim() : matchedDomain;
        const guessedOrgName = matchOrgFromHostname(host || matchedDomain || String(row["FINAL URL"] ?? ""));
        if (guessedOrgName && !orgByName.has(guessedOrgName.toLowerCase())) {
          const newOrg = await findOrCreateOrganization(guessedOrgName);
          orgByName.set(newOrg.name.toLowerCase(), { id: newOrg.id, name: newOrg.name });
        }
      }
    }

    const issuePromises = result.raw_result.map(async (row: any) => {
      const rawOrg = String(row.Organization ?? "").trim();
      let match = (rawOrg && rawOrg !== "unknown" && rawOrg !== "no data")
        ? orgByName.get(rawOrg.toLowerCase())
        : undefined;

      if (!match) {
        const matchedDomain = String(row.matched_domain ?? "");
        const host = row.asset_host ? String(row.asset_host).trim() : matchedDomain;
        const guessedOrgName = matchOrgFromHostname(host || matchedDomain || String(row["FINAL URL"] ?? ""));
        if (guessedOrgName) {
           match = orgByName.get(guessedOrgName.toLowerCase());
        }
      }

      const organizationId = match?.id ?? null;
      const organizationName = match?.name ?? "unknown";

      return prisma.issue.create({
        data: {
          importId: importRecord.id,
          organizationId,
          organizationName,
          organizationNameNormalized: normalizeOrganizationName(organizationName),
          factorName: String(row["FACTOR NAME"] ?? ""),
          issueTypeTitle: String(row["ISSUE TYPE TITLE"] ?? ""),
          severity: String(row["ISSUE TYPE SEVERITY"] ?? ""),
          finalUrl: String(row["FINAL URL"] ?? ""),
          headers: String(row["HEADERS"] ?? ""),
          scoreImpact: Number(row["ISSUE TYPE SCORE IMPACT"] ?? 0),
          createdAt: row["FIRST SEEN"] ? new Date(row["FIRST SEEN"]) : undefined,
          matchedDomain: String(row.matched_domain ?? ""),
          host: (() => {
            const ah = row.asset_host ? String(row.asset_host).trim() : "";
            if (ah && !["no data", "GLOBAL_ASSET", "unknown", ""].includes(ah)) return ah;
            return null;
          })(),
          assetType: (() => {
            const at = row.asset_type ? String(row.asset_type).trim() : "";
            return at || null;
          })(),
        },
      });
    });
    await Promise.all(issuePromises);

    const severityCount = result.severity_count ?? {};
    const totalIssues = result.raw_result.length;

    const statDate = importRecord.snapshotDate
      ? new Date(importRecord.snapshotDate)
      : new Date(importRecord.importDate ?? new Date());
    statDate.setHours(0, 0, 0, 0);

    const avgScore =
      Array.isArray(result.factory_score) && result.factory_score.length
        ? result.factory_score.reduce((acc: number, item: any) => acc + Number(item.SECURITY_SCORE ?? 0), 0) /
          result.factory_score.length
        : 0;

    await prisma.dailyStat.upsert({
      where: { date: statDate },
      create: {
        date: statDate,
        totalIssues,
        highCount: Number(severityCount.HIGH ?? 0),
        mediumCount: Number(severityCount.MEDIUM ?? 0),
        lowCount: Number(severityCount.LOW ?? 0),
        infoCount: Number(severityCount.INFO ?? 0),
        unknownDomainCount: result.url_not_in_domain_unique?.length ?? 0,
        unusedMasterCount: result.unused_master?.length ?? 0,
        averageScore: avgScore,
        riskByHost: result.risk_by_host ?? [],
      },
      update: {
        totalIssues,
        highCount: Number(severityCount.HIGH ?? 0),
        mediumCount: Number(severityCount.MEDIUM ?? 0),
        lowCount: Number(severityCount.LOW ?? 0),
        infoCount: Number(severityCount.INFO ?? 0),
        unknownDomainCount: result.url_not_in_domain_unique?.length ?? 0,
        unusedMasterCount: result.unused_master?.length ?? 0,
        averageScore: avgScore,
        riskByHost: result.risk_by_host ?? [],
      },
    });

    // Write FacultyDailyStat for each organization
    const orgs = await prisma.organization.findMany();
    const issuesForImport = await prisma.issue.findMany({
      where: { importId: importRecord.id }
    });

    for (const org of orgs) {
      const orgIssues = issuesForImport.filter(i => i.organizationId === org.id);
      const orgTotalIssues = orgIssues.length;
      const orgHighCount = orgIssues.filter(i => i.severity === "HIGH").length;
      const orgMediumCount = orgIssues.filter(i => i.severity === "MEDIUM").length;
      const orgLowCount = orgIssues.filter(i => i.severity === "LOW").length;
      const orgInfoCount = orgIssues.filter(i => i.severity === "INFO").length;
      
      const deduction = orgIssues.reduce((acc, issue) => acc + issue.scoreImpact, 0);
      const securityScore = parseFloat((100 * Math.exp(-deduction / 150)).toFixed(1));

      await prisma.facultyDailyStat.upsert({
        where: {
          date_organizationId: {
            date: statDate,
            organizationId: org.id
          }
        },
        create: {
          date: statDate,
          organizationId: org.id,
          totalIssues: orgTotalIssues,
          highCount: orgHighCount,
          mediumCount: orgMediumCount,
          lowCount: orgLowCount,
          infoCount: orgInfoCount,
          securityScore
        },
        update: {
          totalIssues: orgTotalIssues,
          highCount: orgHighCount,
          mediumCount: orgMediumCount,
          lowCount: orgLowCount,
          infoCount: orgInfoCount,
          securityScore
        }
      });
    }

    await prisma.import.update({
      where: { id: importRecord.id },
      data: { status: "success", totalIssues },
    });

    return result;
  } catch (error) {
    await prisma.import
      .update({ where: { id: importRecord.id }, data: { status: "failed", errorMessage: (error as Error).message } })
      .catch(() => undefined);
    throw error;
  }
}

/**
 * Fire-and-forget: run processing for an existing import without blocking the
 * caller. Status transitions (processing → success/failed) happen inside
 * processSecurityScorecardUpload; failures are persisted to the import record.
 */
export function startImportJob(importId: number) {
  processRawCsvFile(importId).catch((err) => {
    console.error(`[import] background job for import ${importId} failed:`, (err as Error).message);
  });
}

export async function processRawCsvFile(importId: number) {
  const record = await prisma.import.findUnique({ where: { id: importId } });
  if (!record) throw new Error(`Import not found: ${importId}`);
  if (!record.rawPath) throw new Error(`No raw file for import ${importId}`);
  if (!fs.existsSync(record.rawPath)) throw new Error(`Raw file missing: ${record.rawPath}`);

  await prisma.import.update({ where: { id: importId }, data: { status: "pending" } });
  return processSecurityScorecardUpload({
    filePath: record.rawPath,
    source: record.source,
    fileName: record.fileName ?? undefined,
    snapshotDate: record.snapshotDate?.toISOString().split("T")[0],
    note: record.note ?? undefined,
    importMode: record.importMode ?? "create",
    uploadedById: record.uploadedById ?? undefined,
    existingImportId: importId,
  });
}

export async function reprocessLatestImport() {
  const latest = await prisma.import.findFirst({ orderBy: { snapshotDate: "desc" } });
  if (!latest) throw new Error("No import records found");
  return processRawCsvFile(latest.id);
}

async function runFetchAndProcess(importId: number, rawPath: string, source: string, uploadedById?: number) {
  try {
    await prisma.import.update({ where: { id: importId }, data: { status: "processing", errorMessage: null } });
    const reportId = await createSscReport(SSC_COMPANY_DOMAIN);
    const downloadUrl = await waitForReport(reportId);
    const csvText = await downloadCsv(downloadUrl);
    fs.writeFileSync(rawPath, csvText, "utf-8");

    return await processSecurityScorecardUpload({
      filePath: rawPath, source, fileName: basename(rawPath),
      uploadedById, existingImportId: importId,
    });
  } catch (error) {
    await prisma.import
      .update({ where: { id: importId }, data: { status: "failed", errorMessage: (error as Error).message } })
      .catch(() => undefined);
    throw error;
  }
}

// Blocking variant — used by the daily cron (no HTTP connection to hold open).
export async function fetchSecurityScorecardFromApi(source = "manualFetch", uploadedById?: number) {
  if (!SSC_COMPANY_DOMAIN || !(await getScorecardApiKey())) {
    throw new Error("Missing SSC configuration: domain or API key");
  }
  const rawPath = buildTimestampedPath("securityscorecard-cron-api", "csv");
  const record = await createImportRecord({ filePath: rawPath, source, fileName: basename(rawPath), uploadedById });
  return runFetchAndProcess(record.id, rawPath, source, uploadedById);
}

/**
 * Non-blocking: create the pending import, kick off the SSC fetch + processing
 * in the background, and return the import id immediately so the HTTP request
 * can respond without holding the connection open for minutes.
 */
export async function startFetchJob(source = "manualFetch", uploadedById?: number): Promise<number> {
  if (!SSC_COMPANY_DOMAIN || !(await getScorecardApiKey())) {
    throw new Error("Missing SSC configuration: domain or API key");
  }
  const rawPath = buildTimestampedPath("securityscorecard-cron-api", "csv");
  const record = await createImportRecord({ filePath: rawPath, source, fileName: basename(rawPath), uploadedById });
  runFetchAndProcess(record.id, rawPath, source, uploadedById).catch((err) => {
    console.error(`[fetch] background job for import ${record.id} failed:`, (err as Error).message);
  });
  return record.id;
}

const IMPORT_SORT_MAP: Record<string, any> = {
  fileName:     { fileName: "asc" },
  source:       { source: "asc" },
  snapshotDate: { snapshotDate: "asc" },
  totalIssues:  { totalIssues: "asc" },
  status:       { status: "asc" },
  uploadedAt:   { uploadedAt: "asc" },
  user:         { uploadedBy: { email: "asc" } },
};

export async function getImportHistory(options?: {
  limit?: number; offset?: number; status?: string; uploadedById?: number;
  sortBy?: string; sortOrder?: string;
}) {
  const { limit = 50, offset = 0, status, uploadedById, sortBy = "uploadedAt", sortOrder = "desc" } = options ?? {};
  const where: any = {};
  if (status) where.status = status;
  if (uploadedById) where.uploadedById = uploadedById;

  const dir: "asc" | "desc" = sortOrder === "asc" ? "asc" : "desc";
  const baseOrder = IMPORT_SORT_MAP[sortBy] ?? { uploadedAt: "asc" };
  const orderBy = JSON.parse(JSON.stringify(baseOrder).replace(/"asc"/g, `"${dir}"`));

  const [items, total] = await Promise.all([
    prisma.import.findMany({
      where,
      include: { uploadedBy: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } },
      orderBy,
      take: limit,
      skip: offset,
    }),
    prisma.import.count({ where }),
  ]);
  return { items, total };
}

export async function reprocessImport(importId: number) {
  const record = await prisma.import.findUnique({ where: { id: importId } });
  if (!record) throw new Error(`Import not found: ${importId}`);
  if (!record.rawPath || !fs.existsSync(record.rawPath)) {
    throw new Error(`Raw file not found for import ${importId}`);
  }
  return processRawCsvFile(importId);
}

export async function deleteImport(importId: number) {
  const record = await prisma.import.findUnique({
    where: { id: importId },
    include: { _count: { select: { issues: true } } },
  });
  if (!record) throw new Error("Import not found");
  await prisma.issue.deleteMany({ where: { importId } });
  await prisma.import.delete({ where: { id: importId } });
  return { success: true, issuesRemoved: record._count.issues };
}

export async function checkDuplicateSnapshot(_date: Date) {
  return null;
}

export async function replaceImport(_originalId: number, _newId: number) {
  throw new Error("Replace import is disabled. Run prisma migrate to enable.");
}
