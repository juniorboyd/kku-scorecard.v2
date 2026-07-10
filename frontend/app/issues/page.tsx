"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Search, Filter, ExternalLink, Download, X } from "lucide-react";
import SeverityBadge from "@/components/ui/SeverityBadge";
import Pagination from "@/components/ui/Pagination";
import SortableHeader from "@/components/ui/SortableHeader";
import { issuesApi } from "@/lib/api";
import { useSnapshot } from "@/lib/snapshotContext";
import IssueDetailModal from "@/components/IssueDetailModal";

const SEVERITIES = ["HIGH", "MEDIUM", "LOW", "INFO"];
const SSC_FACTORS = [
  "Patching Cadence",
  "Application Security",
  "Network Security",
  "DNS Health",
  "Endpoint Security",
  "IP Reputation",
  "Cubit Score",
  "Hacker Chatter",
  "Information Leak",
  "Social Engineering",
];
const PAGE_SIZE = 20;

type SortKey = "organization" | "factor" | "issueType" | "severity" | "asset" | "assetType" | "url" | "impact" | "createdAt";
type SortDir = "asc" | "desc";

type IssueFilters = { organizations: string[]; factors: string[]; severities: string[]; assetTypes: string[] };
const EMPTY_FILTERS: IssueFilters = { organizations: [], factors: [], severities: [], assetTypes: [] };

const ASSET_TYPE_FILTER_OPTIONS = [
  { value: "web",     label: "Web" },
  { value: "dns",     label: "DNS" },
  { value: "ip",      label: "IP Address" },
  { value: "network", label: "Network" },
  { value: "global",  label: "Global" },
];

function triggerCsvDownload(data: ArrayBuffer, filename: string) {
  const blob = new Blob([data], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}


const ASSET_TYPE_DISPLAY: Record<string, { label: string; style: string }> = {
  web:     { label: "Web",        style: "bg-blue-50 text-blue-700" },
  dns:     { label: "DNS",        style: "bg-purple-50 text-purple-700" },
  ip:      { label: "IP Address", style: "bg-orange-50 text-orange-700" },
  network: { label: "Network",    style: "bg-teal-50 text-teal-700" },
  global:  { label: "Global",     style: "bg-gray-100 text-gray-500" },
};


export default function IssuesPage() {
  const { selectedSnapshotId } = useSnapshot();
  const [issues, setIssues] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>("severity");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);

  // Filter state
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingFilters, setPendingFilters] = useState<IssueFilters>(EMPTY_FILTERS);
  const [activeFilters, setActiveFilters] = useState<IssueFilters>(EMPTY_FILTERS);
  const [orgSearch, setOrgSearch] = useState("");
  const filterRef = useRef<HTMLDivElement>(null);

  // Filter options — orgs are dynamic; factors are the fixed SSC list (SSC_FACTORS)
  const [allOrgs, setAllOrgs] = useState<string[]>([]);

  // Export
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async (p: number) => {
    if (selectedSnapshotId === null) return;
    setLoading(true);
    try {
      const r = await issuesApi.getIssues({
        page: p,
        pageSize: PAGE_SIZE,
        search: search || undefined,
        organizations: activeFilters.organizations.length ? activeFilters.organizations : undefined,
        severities: activeFilters.severities.length ? activeFilters.severities : undefined,
        factors: activeFilters.factors.length ? activeFilters.factors : undefined,
        assetTypes: activeFilters.assetTypes.length ? activeFilters.assetTypes : undefined,
        sortBy,
        sortOrder: sortDir,
        snapshotId: selectedSnapshotId,
      });
      setIssues(r.data?.items ?? []);
      setTotal(r.data?.total ?? 0);
    } finally { setLoading(false); }
  }, [search, activeFilters, sortBy, sortDir, selectedSnapshotId]);

  useEffect(() => { load(page); }, [load, page]);

  useEffect(() => {
    if (selectedSnapshotId === null) return;
    issuesApi.getFilterOptions(selectedSnapshotId).then((r) => {
      setAllOrgs(r.data?.organizations ?? []);
    }).catch(() => {});
  }, [selectedSnapshotId]);

  useEffect(() => {
    if (!filterOpen) return;
    function h(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [filterOpen]);

  function handleSort(col: string) {
    if (col === sortBy) {
      setSortDir((d) => d === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col as SortKey);
      setSortDir(col === "impact" || col === "severity" ? "desc" : "asc");
    }
    setPage(1);
  }

  function toggleOrg(o: string) {
    setPendingFilters((p) => ({ ...p, organizations: p.organizations.includes(o) ? p.organizations.filter((x) => x !== o) : [...p.organizations, o] }));
  }
  function toggleFactor(f: string) {
    setPendingFilters((p) => ({ ...p, factors: p.factors.includes(f) ? p.factors.filter((x) => x !== f) : [...p.factors, f] }));
  }
  function toggleSeverity(s: string) {
    setPendingFilters((p) => ({ ...p, severities: p.severities.includes(s) ? p.severities.filter((x) => x !== s) : [...p.severities, s] }));
  }
  function toggleAssetType(t: string) {
    setPendingFilters((p) => ({ ...p, assetTypes: p.assetTypes.includes(t) ? p.assetTypes.filter((x) => x !== t) : [...p.assetTypes, t] }));
  }
  function applyFilters() { setActiveFilters({ ...pendingFilters }); setPage(1); setFilterOpen(false); }
  function clearAllFilters() { setPendingFilters(EMPTY_FILTERS); setActiveFilters(EMPTY_FILTERS); setPage(1); setFilterOpen(false); }

  function removeOrgTag(o: string) {
    const u = { ...activeFilters, organizations: activeFilters.organizations.filter((x) => x !== o) };
    setActiveFilters(u); setPendingFilters(u); setPage(1);
  }
  function removeFactorTag(f: string) {
    const u = { ...activeFilters, factors: activeFilters.factors.filter((x) => x !== f) };
    setActiveFilters(u); setPendingFilters(u); setPage(1);
  }
  function removeSeverityTag(s: string) {
    const u = { ...activeFilters, severities: activeFilters.severities.filter((x) => x !== s) };
    setActiveFilters(u); setPendingFilters(u); setPage(1);
  }
  function removeAssetTypeTag(t: string) {
    const u = { ...activeFilters, assetTypes: activeFilters.assetTypes.filter((x) => x !== t) };
    setActiveFilters(u); setPendingFilters(u); setPage(1);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const r = await issuesApi.exportCsv({
        search: search || undefined,
        organizations: activeFilters.organizations.length ? activeFilters.organizations : undefined,
        severities: activeFilters.severities.length ? activeFilters.severities : undefined,
        factors: activeFilters.factors.length ? activeFilters.factors : undefined,
        assetTypes: activeFilters.assetTypes.length ? activeFilters.assetTypes : undefined,
        sortBy,
        sortOrder: sortDir,
        snapshotId: selectedSnapshotId,
      });
      const date = new Date().toISOString().split("T")[0];
      triggerCsvDownload(r.data as ArrayBuffer, `issues_export_${date}.csv`);
    } catch { /* silently ignore */ }
    finally { setExporting(false); }
  }

  const filteredOrgList = orgSearch
    ? allOrgs.filter((o) => o.toLowerCase().includes(orgSearch.toLowerCase()))
    : allOrgs;

  const totalFilterCount = activeFilters.organizations.length + activeFilters.factors.length + activeFilters.severities.length + activeFilters.assetTypes.length;

  return (
    <div className="space-y-4">
      {/* Search + Filter + Export bar */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9 w-full"
            placeholder="Search by organization, factor, issue type, or asset..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Filter popover */}
        <div className="relative" ref={filterRef}>
          <button
            className="btn-secondary flex items-center gap-1.5"
            onClick={() => { setPendingFilters({ ...activeFilters }); setOrgSearch(""); setFilterOpen((o) => !o); }}
          >
            <Filter className="w-4 h-4" />
            {totalFilterCount > 0 ? `Filter (${totalFilterCount})` : "Filter"}
          </button>

          {filterOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 flex flex-col">
              <div className="p-4 space-y-5 overflow-y-auto" style={{ maxHeight: "480px" }}>

                {/* Organization */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Organization</p>
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
                    <input className="input pl-8 text-xs py-1.5 w-full" placeholder="Search org..."
                      value={orgSearch} onChange={(e) => setOrgSearch(e.target.value)} />
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {filteredOrgList.length === 0
                      ? <p className="text-xs text-gray-400">No results</p>
                      : filteredOrgList.map((org) => (
                          <label key={org} className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" checked={pendingFilters.organizations.includes(org)}
                              onChange={() => toggleOrg(org)} className="rounded border-gray-300 text-blue-600" />
                            <span className="text-sm text-gray-700 truncate group-hover:text-gray-900">{org}</span>
                          </label>
                        ))}
                  </div>
                </div>

                {/* Factor */}
                <div>
                  <div className="border-t border-gray-100 -mx-4 mb-4" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Factor</p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {SSC_FACTORS.map((f) => (
                      <label key={f} className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={pendingFilters.factors.includes(f)}
                          onChange={() => toggleFactor(f)} className="rounded border-gray-300 text-blue-600" />
                        <span className="text-sm text-gray-700 truncate group-hover:text-gray-900">{f}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Severity */}
                <div>
                  <div className="border-t border-gray-100 -mx-4 mb-4" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Severity</p>
                  <div className="space-y-1.5">
                    {SEVERITIES.map((s) => (
                      <label key={s} className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={pendingFilters.severities.includes(s)}
                          onChange={() => toggleSeverity(s)} className="rounded border-gray-300 text-blue-600" />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900">{s}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Asset Type */}
                <div>
                  <div className="border-t border-gray-100 -mx-4 mb-4" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Asset Type</p>
                  <div className="space-y-1.5">
                    {ASSET_TYPE_FILTER_OPTIONS.map(({ value, label }) => (
                      <label key={value} className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={pendingFilters.assetTypes.includes(value)}
                          onChange={() => toggleAssetType(value)} className="rounded border-gray-300 text-blue-600" />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between shrink-0">
                <button className="text-sm text-gray-500 hover:text-gray-800 transition-colors" onClick={clearAllFilters}>
                  Clear All
                </button>
                <button className="btn-primary text-sm py-1.5 px-4" onClick={applyFilters}>Apply</button>
              </div>
            </div>
          )}
        </div>

        {/* Export */}
        <button className="btn-secondary flex items-center gap-1.5" onClick={handleExport} disabled={exporting}>
          <Download className="w-4 h-4" />
          {exporting ? "Exporting..." : "Export"}
        </button>
      </div>

      {/* Active filter tags */}
      {totalFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 px-0.5">
          {activeFilters.organizations.map((o) => (
            <span key={`org-${o}`} className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
              Org: {o}
              <button onClick={() => removeOrgTag(o)} className="p-0.5 hover:bg-blue-100 rounded-full transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {activeFilters.factors.map((f) => (
            <span key={`factor-${f}`} className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-purple-50 text-purple-700 text-xs rounded-full font-medium">
              Factor: {f}
              <button onClick={() => removeFactorTag(f)} className="p-0.5 hover:bg-purple-100 rounded-full transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {activeFilters.severities.map((s) => (
            <span key={`sev-${s}`} className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-orange-50 text-orange-700 text-xs rounded-full font-medium">
              Severity: {s}
              <button onClick={() => removeSeverityTag(s)} className="p-0.5 hover:bg-orange-100 rounded-full transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {activeFilters.assetTypes.map((t) => (
            <span key={`type-${t}`} className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-teal-50 text-teal-700 text-xs rounded-full font-medium">
              Type: {ASSET_TYPE_DISPLAY[t]?.label ?? t}
              <button onClick={() => removeAssetTypeTag(t)} className="p-0.5 hover:bg-teal-100 rounded-full transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <SortableHeader label="Organization" field="organization" currentSort={sortBy} currentOrder={sortDir} onSort={handleSort} />
                <SortableHeader label="Factor"       field="factor"       currentSort={sortBy} currentOrder={sortDir} onSort={handleSort} />
                <SortableHeader label="Issue Type"   field="issueType"    currentSort={sortBy} currentOrder={sortDir} onSort={handleSort} />
                <SortableHeader label="Severity"     field="severity"     currentSort={sortBy} currentOrder={sortDir} onSort={handleSort} />
                <SortableHeader label="Asset"        field="asset"        currentSort={sortBy} currentOrder={sortDir} onSort={handleSort} />
                <SortableHeader label="Asset Type"   field="assetType"    currentSort={sortBy} currentOrder={sortDir} onSort={handleSort} />
                <SortableHeader label="URL"          field="url"          currentSort={sortBy} currentOrder={sortDir} onSort={handleSort} />
                <SortableHeader label="Impact"       field="impact"       currentSort={sortBy} currentOrder={sortDir} onSort={handleSort} align="right" />
                <SortableHeader label="Time"         field="createdAt"    currentSort={sortBy} currentOrder={sortDir} onSort={handleSort} align="right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={9} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : issues.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">No issues found</td></tr>
              ) : (
                issues.map((issue: any) => (
                  <tr key={issue.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedIssue(issue)}>
                    <td className="px-4 py-3 text-gray-700 max-w-[180px] truncate text-xs">{issue.organizationName || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate text-xs">{issue.factorName}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate text-xs">{issue.issueTypeTitle}</td>
                    <td className="px-4 py-3"><SeverityBadge severity={issue.severity} /></td>
                    <td className="px-4 py-3 max-w-[160px] truncate text-xs">
                      {issue.asset
                        ? <span className="text-gray-700">{issue.asset}</span>
                        : <span className="italic text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      {issue.assetType ? (() => {
                        const d = ASSET_TYPE_DISPLAY[issue.assetType];
                        return (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${d?.style ?? "bg-gray-100 text-gray-500"}`}>
                            {d?.label ?? issue.assetType}
                          </span>
                        );
                      })() : <span className="italic text-gray-400 text-xs">-</span>}
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      {issue.finalUrl ? (
                        <a href={issue.finalUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-brand-800 hover:underline truncate text-xs">
                          <span className="truncate">{issue.finalUrl}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      ) : <span className="italic text-gray-400 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-gray-600">
                      {issue.scoreImpact?.toFixed(3)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500 whitespace-nowrap">
                      {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 border-t border-gray-100">
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={(p) => { setPage(p); load(p); }} />
        </div>
      </div>

      {/* Detail Modal */}
      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
        />
      )}
    </div>
  );
}
