import prisma from "../lib/prisma.ts";
import { subDays } from "date-fns";
import axios from "axios";
import { normalizeThai } from "../utils/textUtils.ts";
import { SSC_API_KEY_HEADER, SSC_COMPANY_DOMAIN, SSC_SCORE_HISTORY_URL, SSC_API_URL } from "../config.ts";
import { getScorecardApiKey } from "./settingsService.ts";

function scoreHistoryUrl() {
  if (SSC_SCORE_HISTORY_URL) return SSC_SCORE_HISTORY_URL;
  if (!SSC_API_URL) return "";
  try {
    const base = new URL(SSC_API_URL).origin;
    return `${base}/companies/${SSC_COMPANY_DOMAIN}/history/score?timing=daily`;
  } catch { return ""; }
}

async function fetchScoreHistory() {
  const url = scoreHistoryUrl();
  const apiKey = await getScorecardApiKey();
  if (!url || !apiKey) return [];
  try {
    const r = await axios.get(url, {
      headers: { accept: "application/json; charset=utf-8", [SSC_API_KEY_HEADER]: `Token ${apiKey}` },
      timeout: 30000,
    });
    const entries = Array.isArray(r.data?.entries) ? r.data.entries : [];
    return entries
      .map((e: any) => ({ date: e.date, score: Number(e.score ?? 0), domain: e.domain }))
      .filter((e: any) => e.date)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch { return []; }
}

async function getLatestImportId(options?: { snapshotDate?: string; importId?: number }): Promise<number | null> {
  if (options?.importId) return options.importId;
  const where: any = { status: "success" };
  if (options?.snapshotDate) {
    const start = new Date(options.snapshotDate); start.setHours(0, 0, 0, 0);
    const end = new Date(options.snapshotDate); end.setHours(23, 59, 59, 999);
    where.snapshotDate = { gte: start, lte: end };
  }
  const r = await prisma.import.findFirst({ where, orderBy: { snapshotDate: "desc" }, select: { id: true } });
  return r?.id ?? null;
}

/**
 * Snapshot-over-snapshot deltas from DailyStat. Compares the current snapshot's
 * DailyStat against the most recent DailyStat dated before it. Returns null when
 * there is no current stat or no earlier stat to compare against.
 */
async function computeStatDeltas(
  latestStat: { date: Date; totalIssues: number; highCount: number; averageScore: number } | null,
  snapshotDate: Date | null,
) {
  // Resolve the "current" stat: prefer the one matching the selected snapshot's
  // date, otherwise fall back to the latest stat (matches the displayed KPIs).
  let currentStat = latestStat;
  if (snapshotDate) {
    const start = new Date(snapshotDate); start.setHours(0, 0, 0, 0);
    const end = new Date(snapshotDate); end.setHours(23, 59, 59, 999);
    const matched = await prisma.dailyStat.findFirst({
      where: { date: { gte: start, lte: end } },
      orderBy: { date: "desc" },
    });
    if (matched) currentStat = matched;
  }
  if (!currentStat) return null;

  const previousStat = await prisma.dailyStat.findFirst({
    where: { date: { lt: currentStat.date } },
    orderBy: { date: "desc" },
  });
  if (!previousStat) return null;

  return {
    totalIssues: currentStat.totalIssues - previousStat.totalIssues,
    highCount: currentStat.highCount - previousStat.highCount,
    score: Number((currentStat.averageScore - previousStat.averageScore).toFixed(1)),
    previousDate: previousStat.date,
  };
}

export async function getDashboardOverview(options?: { snapshotDate?: string; importId?: number }) {
  const latestImportId = await getLatestImportId(options);
  if (!latestImportId) {
    return { latestStat: null, topOrganizations: [], topIssueTypes: [], topDomains: [], noDataHost: null, scoreHistory: [], dailyTrend: [], weeklyTrend: [], monthlyTrend: [], severityBreakdown: [], deltas: null };
  }

  const [latestStat, topOrganizations, topIssueTypes, scoreHistory] = await Promise.all([
    prisma.dailyStat.findFirst({ orderBy: { date: "desc" } }),
    prisma.issue.groupBy({ by: ["organizationName"], where: { importId: latestImportId }, _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 10 }),
    prisma.issue.groupBy({ by: ["issueTypeTitle"], where: { importId: latestImportId }, _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 10 }),
    fetchScoreHistory(),
  ]);

  const hostRows = Array.isArray(latestStat?.riskByHost)
    ? (latestStat.riskByHost as any[]).map((item) => ({
        host: item.host ?? item.HOST ?? item.domain ?? item.asset_host ?? "unknown",
        organization: item.ORGANIZATION ?? item.organization ?? undefined,
        totalIssues: Number(item.TOTAL_ISSUES ?? item.totalIssues ?? 0),
        totalRiskScore: Number(item.TOTAL_RISK_SCORE ?? item.totalRiskScore ?? 0),
      }))
    : [];

  const noDataHost = hostRows.find((h) => h.host === "no data") ?? null;
  const topDomains = hostRows.filter((h) => h.host !== "no data").slice(0, 10);

  const today = new Date();
  const [dailyTrend, weeklyTrend, monthlyTrend, severityBreakdown, currentImport] = await Promise.all([
    prisma.dailyStat.findMany({ orderBy: { date: "asc" } }),
    prisma.dailyStat.findMany({ where: { date: { gte: subDays(today, 7) } }, orderBy: { date: "asc" } }),
    prisma.dailyStat.findMany({ where: { date: { gte: subDays(today, 30) } }, orderBy: { date: "asc" } }),
    prisma.issue.groupBy({ by: ["severity"], where: { importId: latestImportId }, _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
    prisma.import.findUnique({ where: { id: latestImportId }, select: { snapshotDate: true } }),
  ]);

  const deltas = await computeStatDeltas(latestStat, currentImport?.snapshotDate ?? null);

  return { latestStat, topOrganizations, topIssueTypes, topDomains, noDataHost, scoreHistory, dailyTrend, weeklyTrend, monthlyTrend, severityBreakdown, deltas };
}

const SEVERITY_WEIGHT: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2, INFO: 3 };

function buildIssueFilters(query: {
  organizationName?: string; organizations?: string[];
  severity?: string; severities?: string[];
  factor?: string; factors?: string[];
  assetTypes?: string[];
  search?: string; dateFrom?: string; dateTo?: string;
  importId: number;
}) {
  const filters: any = { importId: query.importId };

  if (query.severities?.length) {
    filters.severity = { in: query.severities.map((s) => s.toUpperCase()) };
  } else if (query.severity) {
    filters.severity = query.severity.toUpperCase();
  }

  if (query.factors?.length) {
    filters.factorName = { in: query.factors };
  } else if (query.factor) {
    filters.factorName = { contains: query.factor, mode: "insensitive" };
  }

  if (query.organizations?.length) {
    filters.organizationName = { in: query.organizations };
  } else if (query.organizationName) {
    filters.organizationNameNormalized = { contains: normalizeThai(query.organizationName) };
  }

  if (query.assetTypes?.length) {
    filters.assetType = { in: query.assetTypes };
  }

  if (query.search) {
    const ns = normalizeThai(query.search);
    filters.OR = [
      { finalUrl: { contains: query.search, mode: "insensitive" } },
      { issueTypeTitle: { contains: query.search, mode: "insensitive" } },
      { factorName: { contains: query.search, mode: "insensitive" } },
      { matchedDomain: { contains: query.search, mode: "insensitive" } },
      { host: { contains: query.search, mode: "insensitive" } },
      { organizationNameNormalized: { contains: ns } },
    ];
  }

  if (query.dateFrom || query.dateTo) {
    const df: any = {};
    if (query.dateFrom) df.gte = new Date(query.dateFrom);
    if (query.dateTo) df.lte = new Date(query.dateTo);
    filters.createdAt = df;
  }

  return filters;
}

function buildIssueOrderBy(sortBy: string, sortOrder?: string): any[] {
  const dir: "asc" | "desc" = sortOrder === "asc" ? "asc" : "desc";
  const fieldMap: Record<string, string> = {
    organization: "organizationName",
    factor: "factorName",
    issueType: "issueTypeTitle",
    impact: "scoreImpact",
    asset: "host",
    assetType: "assetType",
    url: "finalUrl",
  };
  const field = fieldMap[sortBy] ?? "organizationName";
  return [{ [field]: dir }, { organizationName: "asc" }];
}

const SKIP_ASSET_VALUES = new Set(["unknown", "no data", "GLOBAL_ASSET", ""]);

function enrichIssue(issue: any) {
  const h = issue.host;
  const asset = h && !SKIP_ASSET_VALUES.has(h) ? h : null;
  return { ...issue, asset };
}

export async function getIssueExplorer(query: {
  page?: number; pageSize?: number; dateFrom?: string; dateTo?: string;
  organizationName?: string; organizations?: string[];
  severity?: string; severities?: string[];
  factor?: string; factors?: string[];
  assetTypes?: string[];
  search?: string; importId?: number;
  sortBy?: string; sortOrder?: string;
  exportAll?: boolean;
}) {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = query.exportAll ? 999999 : Math.min(100, query.pageSize ?? 20);
  const skip = (page - 1) * pageSize;

  let importId = query.importId;
  if (!importId) {
    const id = await getLatestImportId();
    if (!id) return { page: 1, pageSize, total: 0, items: [] };
    importId = id;
  }

  const filters = buildIssueFilters({ ...query, importId });
  const sortBy = query.sortBy ?? "severity";
  const sortOrder = query.sortOrder ?? "desc";

  if (sortBy === "severity") {
    // In-app sort using weight map — guarantees HIGH→MEDIUM→LOW→INFO order
    const sortRows = await prisma.issue.findMany({
      where: filters,
      select: { id: true, severity: true, organizationName: true, matchedDomain: true, host: true },
    });

    sortRows.sort((a, b) => {
      const wA = SEVERITY_WEIGHT[a.severity] ?? 4;
      const wB = SEVERITY_WEIGHT[b.severity] ?? 4;
      // desc = HIGH first (ascending weight); asc = INFO first (descending weight)
      const wCmp = sortOrder === "asc" ? wB - wA : wA - wB;
      if (wCmp !== 0) return wCmp;
      const orgCmp = (a.organizationName ?? "").localeCompare(b.organizationName ?? "");
      if (orgCmp !== 0) return orgCmp;
      return (a.host || "").localeCompare(b.host || "");
    });

    const total = sortRows.length;
    const pageIds = sortRows.slice(skip, skip + pageSize).map((r) => r.id);
    if (pageIds.length === 0) return { page, pageSize, total, items: [] };

    const records = await prisma.issue.findMany({ where: { id: { in: pageIds } } });
    const recMap = new Map(records.map((r) => [r.id, r]));
    const items = pageIds.map((id) => recMap.get(id)).filter(Boolean).map(enrichIssue);
    return { page, pageSize, total, items };
  }

  const orderBy = buildIssueOrderBy(sortBy, sortOrder);
  const [items, total] = await Promise.all([
    prisma.issue.findMany({ where: filters, orderBy, skip, take: pageSize }),
    prisma.issue.count({ where: filters }),
  ]);
  return { page, pageSize, total, items: items.map(enrichIssue) };
}

export async function getIssueFilterOptions(importId?: number) {
  const id = importId ?? await getLatestImportId();
  if (!id) return { organizations: [] };

  const orgs = await prisma.issue.findMany({
    where: { importId: id, organizationName: { not: null } },
    select: { organizationName: true },
    distinct: ["organizationName"],
    orderBy: { organizationName: "asc" },
  });

  const SKIP_VALUES = new Set(["unknown", "no data", ""]);
  return {
    organizations: orgs.map((o) => o.organizationName).filter((n): n is string => !!n && !SKIP_VALUES.has(n)),
  };
}

// Used only for Domain table entries (master registry) which have no assetType field.
// IP addresses become "ip"; everything else (managed web domains) becomes "web".
function domainTableAssetType(domain: string): "web" | "ip" {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(domain) ? "ip" : "web";
}

// Fallback for Issues that were imported before assetType was added.
function inferAssetType(host: string): string {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(host) ? "ip" : "web";
}

const SKIP_HOSTS = new Set(["GLOBAL_ASSET", "no data", "unknown", ""]);

export function buildCsv(rows: any[], cols: { key: string; header: string }[]): string {
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = cols.map((c) => esc(c.header)).join(",");
  const body = rows.map((r) => cols.map((c) => esc(r[c.key])).join(",")).join("\n");
  return "﻿" + header + "\n" + body;
}

// Assets page: every row comes from the SSC report (Issue table).
// Status is always "Vulnerable"; "Unassigned" means org could not be matched.
export async function getAssets(query: {
  page?: number;
  pageSize?: number;
  search?: string;
  assigned?: "all" | "known" | "unassigned";
  organizations?: string[];
  types?: string[];
  importId?: number;
  exportAll?: boolean;
  sortBy?: string;
  sortOrder?: string;
}) {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = query.exportAll ? 999999 : Math.min(100, query.pageSize ?? 20);
  const skip = (page - 1) * pageSize;

  const latestImportId = await getLatestImportId({ importId: query.importId });
  if (!latestImportId) {
    return { page, pageSize, total: 0, items: [], kpis: { total: 0, web: 0, dns: 0, ip: 0, network: 0 } };
  }

  const allIssues = await prisma.issue.findMany({
    where: { importId: latestImportId },
    select: { host: true, matchedDomain: true, organizationName: true, assetType: true },
  });

  // One row per unique scanned host; use host as the asset identifier
  const hostMap = new Map<string, { host: string; organization: string | null; issueCount: number; assetType: string }>();
  for (const issue of allIssues) {
    const h = issue.host || issue.matchedDomain;
    if (!h || SKIP_HOSTS.has(h)) continue;
    const existing = hostMap.get(h);
    if (existing) {
      existing.issueCount++;
    } else {
      // Use assetType from DB; fall back to inference for data imported before migration
      hostMap.set(h, {
        host: h,
        organization: issue.organizationName,
        issueCount: 1,
        assetType: issue.assetType || inferAssetType(h),
      });
    }
  }

  let items = Array.from(hostMap.values()).map((item) => {
    const isUnknown = !item.organization || SKIP_HOSTS.has(item.organization);
    return {
      host: item.host,
      organization: isUnknown ? null : item.organization,
      assigned: !isUnknown,
      type: item.assetType,
      issueCount: item.issueCount,
    };
  });

  if (query.search) {
    const s = query.search.toLowerCase();
    items = items.filter(
      (d) => d.host.toLowerCase().includes(s) || (d.organization ?? "").toLowerCase().includes(s)
    );
  }
  if (query.assigned === "unassigned") {
    items = items.filter((d) => !d.assigned);
  } else if (query.assigned === "known") {
    items = items.filter((d) => d.assigned);
    if (query.organizations?.length) {
      const orgSet = new Set(query.organizations);
      items = items.filter((d) => d.organization && orgSet.has(d.organization));
    }
  } else if (query.organizations?.length) {
    const orgSet = new Set(query.organizations);
    items = items.filter((d) => d.organization && orgSet.has(d.organization));
  }
  if (query.types?.length) items = items.filter((d) => query.types!.includes(d.type));

  const sortBy = query.sortBy ?? "issueCount";
  const sortDir = query.sortOrder === "asc" ? 1 : -1;
  items.sort((a, b) => {
    let cmp = 0;
    if (sortBy === "host") cmp = a.host.localeCompare(b.host);
    else if (sortBy === "type") cmp = a.type.localeCompare(b.type);
    else if (sortBy === "organization") cmp = (a.organization ?? "").localeCompare(b.organization ?? "");
    else cmp = a.issueCount - b.issueCount;
    return cmp * sortDir;
  });

  const total = items.length;
  const kpis = {
    total,
    web: items.filter((d) => d.type === "web").length,
    dns: items.filter((d) => d.type === "dns").length,
    ip: items.filter((d) => d.type === "ip").length,
    network: items.filter((d) => d.type === "network").length,
  };

  return { page, pageSize, total, items: items.slice(skip, skip + pageSize), kpis };
}

export async function getOrgStats(options?: { importId?: number }) {
  const [totalOrganizations, latestImportId] = await Promise.all([
    prisma.organization.count(),
    getLatestImportId({ importId: options?.importId }),
  ]);

  if (!latestImportId) {
    return { totalOrganizations, totalAssets: 0, unassignedAssets: 0 };
  }

  const allIssues = await prisma.issue.findMany({
    where: { importId: latestImportId },
    select: { host: true, matchedDomain: true, organizationName: true },
  });

  const hostMap = new Map<string, boolean>(); // host -> isUnknown
  for (const issue of allIssues) {
    const h = issue.host || issue.matchedDomain;
    if (!h || SKIP_HOSTS.has(h)) continue;
    if (!hostMap.has(h)) {
      const isUnknown = !issue.organizationName || SKIP_HOSTS.has(issue.organizationName);
      hostMap.set(h, isUnknown);
    }
  }

  let unassignedAssets = 0;
  for (const isUnknown of hostMap.values()) {
    if (isUnknown) unassignedAssets++;
  }

  return { totalOrganizations, totalAssets: hostMap.size, unassignedAssets };
}

// Organizations page Asset Explorer: source is Domain table (our master registry).
// Per-domain status = check if domain appears in the current snapshot's issues.
export async function getDomainList(query: {
  page?: number;
  pageSize?: number;
  search?: string;
  organizations?: string[];
  types?: string[];
  statuses?: string[];
  importId?: number;
  exportAll?: boolean;
  sortBy?: string;
  sortOrder?: string;
}) {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = query.exportAll ? 999999 : Math.min(100, query.pageSize ?? 20);
  const skip = (page - 1) * pageSize;

  const latestImportId = await getLatestImportId({ importId: query.importId });

  // Build a set of matched domains that have issues in this snapshot
  const issueMatchedDomains = new Set<string>();
  const issueCountMap = new Map<string, number>();
  if (latestImportId) {
    const [issueHostRows, issueCountRows] = await Promise.all([
      prisma.issue.findMany({
        where: { importId: latestImportId, matchedDomain: { not: null } },
        select: { matchedDomain: true },
      }),
      prisma.issue.groupBy({
        by: ["matchedDomain"],
        where: { importId: latestImportId, matchedDomain: { not: null } },
        _count: { id: true },
      }),
    ]);
    for (const i of issueHostRows) {
      if (i.matchedDomain && !SKIP_HOSTS.has(i.matchedDomain)) {
        issueMatchedDomains.add(i.matchedDomain);
      }
    }
    for (const r of issueCountRows) {
      if (r.matchedDomain && !SKIP_HOSTS.has(r.matchedDomain)) {
        issueCountMap.set(r.matchedDomain, r._count.id);
      }
    }
  }

  const where: any = {};
  if (query.search) {
    where.OR = [
      { domain: { contains: query.search, mode: "insensitive" } },
      { organization: { name: { contains: query.search, mode: "insensitive" } } },
    ];
  }
  if (query.organizations?.length) {
    where.organization = { name: { in: query.organizations } };
  }

  const rawDomains = await prisma.domain.findMany({
    where,
    include: { organization: true },
    orderBy: { domain: "asc" },
  });

  const enriched = rawDomains.map((d) => ({
    id: d.id,
    domain: d.domain,
    type: domainTableAssetType(d.domain),
    organization: d.organization.name,
    organizationId: d.organizationId,
    status: issueMatchedDomains.has(d.domain) ? "Vulnerable" : "Healthy",
    issueCount: issueCountMap.get(d.domain) ?? 0,
  }));

  const filtered = enriched.filter((d) => {
    if (query.types?.length && !query.types.includes(d.type)) return false;
    if (query.statuses?.length && !query.statuses.includes(d.status)) return false;
    return true;
  });

  const domSortBy = query.sortBy ?? "issueCount";
  const domSortDir = query.sortOrder === "asc" ? 1 : -1;
  filtered.sort((a, b) => {
    let cmp = 0;
    if (domSortBy === "domain") cmp = a.domain.localeCompare(b.domain);
    else if (domSortBy === "type") cmp = a.type.localeCompare(b.type);
    else if (domSortBy === "organization") cmp = a.organization.localeCompare(b.organization);
    else if (domSortBy === "status") cmp = a.status.localeCompare(b.status);
    else cmp = a.issueCount - b.issueCount;
    return cmp * domSortDir;
  });

  const total = filtered.length;
  const items = filtered.slice(skip, skip + pageSize);
  const kpis = {
    total,
    web: filtered.filter((d) => d.type === "web").length,
    ip: filtered.filter((d) => d.type === "ip").length,
  };

  return { page, pageSize, total, items, kpis };
}

export async function getOrgScores(options?: { snapshotDate?: string; importId?: number }) {
  const latestImportId = await getLatestImportId(options);
  if (!latestImportId) return [];

  const allIssues = await prisma.issue.findMany({
    where: { importId: latestImportId },
    select: { scoreImpact: true, organizationName: true, organizationId: true },
  });

  // ORG_DEDUCTION = Σ scoreImpact for all issues belonging to that org.
  // "no data" is normalised to "unknown" so the frontend needs only one sentinel key.
  const orgDeductionMap = new Map<string, { id: number | null, deduction: number }>();
  for (const issue of allIssues) {
    const raw = issue.organizationName;
    if (!raw) continue;
    const org = raw === "no data" ? "unknown" : raw;
    const existing = orgDeductionMap.get(org) ?? { id: issue.organizationId, deduction: 0 };
    existing.deduction += issue.scoreImpact;
    orgDeductionMap.set(org, existing);
  }

  // ORG_SCORE = 100 * exp(-ORG_DEDUCTION / 150)
  return Array.from(orgDeductionMap.entries())
    .map(([organization, item]) => ({
      organization,
      id: item.id,
      securityScore: parseFloat((100 * Math.exp(-item.deduction / 150)).toFixed(1)),
    }))
    .sort((a, b) => a.securityScore - b.securityScore);
}

export async function getAvailableSnapshotDates() {
  const imports = await prisma.import.findMany({
    where: { status: "success", snapshotDate: { not: null } },
    select: { id: true, snapshotDate: true, totalIssues: true },
    orderBy: { snapshotDate: "desc" },
  });
  return imports;
}

export async function getFacultyScoreHistory(organizationId: number) {
  const stats = await prisma.facultyDailyStat.findMany({
    where: { organizationId },
    orderBy: { date: "asc" },
    select: {
      date: true,
      securityScore: true,
      totalIssues: true,
      highCount: true,
      mediumCount: true,
      lowCount: true,
      infoCount: true,
    },
  });
  return stats;
}
