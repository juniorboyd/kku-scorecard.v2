"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Globe, Server, Network, Filter, X, UserPlus, Download, Plus, ChevronDown } from "lucide-react";
import KpiCard from "@/components/ui/KpiCard";
import Pagination from "@/components/ui/Pagination";
import SortableHeader from "@/components/ui/SortableHeader";
import { assetsApi, orgsApi } from "@/lib/api";
import { useSnapshot } from "@/lib/snapshotContext";
import { useCanEdit } from "@/lib/me";
import { useToast } from "@/lib/toast";

const PAGE_SIZE = 20;

type Assigned = "all" | "known" | "unassigned";
type AssetFilters = { assigned: Assigned; selectedOrgs: string[]; types: string[] };
const EMPTY_FILTERS: AssetFilters = { assigned: "all", selectedOrgs: [], types: [] };

const ASSET_TYPE_OPTIONS = [
  { value: "web",     label: "Web" },
  { value: "dns",     label: "DNS" },
  { value: "ip",      label: "IP Address" },
  { value: "network", label: "Network" },
  { value: "global",  label: "Global" },
];

const ASSET_TYPE_DISPLAY: Record<string, { label: string; style: string }> = {
  web:     { label: "Web",        style: "text-blue-700 bg-blue-50" },
  dns:     { label: "DNS",        style: "text-purple-700 bg-purple-50" },
  ip:      { label: "IP Address", style: "text-orange-700 bg-orange-50" },
  network: { label: "Network",    style: "text-teal-700 bg-teal-50" },
  global:  { label: "Global",     style: "text-gray-500 bg-gray-100" },
};

/**
 * Build the initial filter state from URL params so a linked filter
 * (e.g. /assets?orgAssignment=unassigned) is active on the very first render.
 * This makes the first (and only) fetch already carry the filter — no extra
 * request, no race, no "click Apply" needed. Extend here for future URL filters.
 */
function parseUrlFilters(sp: { get(name: string): string | null }): AssetFilters {
  const f: AssetFilters = { ...EMPTY_FILTERS };
  const assignment = sp.get("orgAssignment");
  if (assignment === "unassigned" || assignment === "known") f.assigned = assignment;
  const types = sp.get("types");
  if (types) {
    const valid = new Set(ASSET_TYPE_OPTIONS.map((o) => o.value));
    f.types = types.split(",").map((t) => t.trim()).filter((t) => valid.has(t));
  }
  return f;
}

function triggerCsvDownload(data: ArrayBuffer, filename: string) {
  const blob = new Blob([data], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function AssetsPage() {
  const { selectedSnapshotId } = useSnapshot();
  const searchParams = useSearchParams();
  const canEdit = useCanEdit();
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("issueCount");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filter panel — seed from URL params so a pre-applied filter is active on
  // first render (single correctly-filtered fetch; avoids the apply-on-mount race).
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingFilters, setPendingFilters] = useState<AssetFilters>(() => parseUrlFilters(searchParams));
  const [activeFilters, setActiveFilters] = useState<AssetFilters>(() => parseUrlFilters(searchParams));
  const [orgPanelSearch, setOrgPanelSearch] = useState("");
  const filterRef = useRef<HTMLDivElement>(null);

  // Org list (with IDs for assign panel)
  const [allOrgs, setAllOrgs] = useState<{ id: number; name: string }[]>([]);

  // Export dropdown
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Assign panel
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignAsset, setAssignAsset] = useState<{ host: string; type: string } | null>(null);
  const [assignDomain, setAssignDomain] = useState("");
  const [assignOrgSearch, setAssignOrgSearch] = useState("");
  const [assignOrgDropOpen, setAssignOrgDropOpen] = useState(false);
  const [assignSelectedOrg, setAssignSelectedOrg] = useState<{ id: number; name: string } | null>(null);
  const [assignSaving, setAssignSaving] = useState(false);
  const assignOrgRef = useRef<HTMLDivElement>(null);

  const toast = useToast();

  // ── Loaders ───────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (selectedSnapshotId === null) return;
    setLoading(true);
    try {
      const r = await assetsApi.getAssets({
        page, pageSize: PAGE_SIZE,
        search: search || undefined,
        assigned: activeFilters.assigned === "all" ? undefined : activeFilters.assigned,
        organizations: activeFilters.selectedOrgs.length ? activeFilters.selectedOrgs : undefined,
        types: activeFilters.types.length ? activeFilters.types : undefined,
        snapshotId: selectedSnapshotId,
        sortBy,
        sortOrder,
      });
      setData(r.data);
    } finally { setLoading(false); }
  }, [page, search, activeFilters, selectedSnapshotId, sortBy, sortOrder]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    orgsApi.list({ limit: 1000 }).then((r) =>
      setAllOrgs(
        (r.items ?? [])
          .map((o: any) => ({ id: o.id as number, name: o.name as string }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name, "th"))
      )
    );
  }, []);

  // Close filter panel on outside click
  useEffect(() => {
    if (!filterOpen) return;
    function h(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [filterOpen]);

  // Close export dropdown on outside click
  useEffect(() => {
    if (!exportOpen) return;
    function h(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [exportOpen]);

  // Close assign org dropdown on outside click
  useEffect(() => {
    if (!assignOrgDropOpen) return;
    function h(e: MouseEvent) {
      if (assignOrgRef.current && !assignOrgRef.current.contains(e.target as Node)) setAssignOrgDropOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [assignOrgDropOpen]);

  // ── Sort ──────────────────────────────────────────────────────────
  function handleSort(field: string) {
    if (field === sortBy) {
      setSortOrder((o) => o === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder(field === "issueCount" ? "desc" : "asc");
    }
    setPage(1);
  }

  // ── Filter helpers ────────────────────────────────────────────────
  function setAssigned(v: Assigned) {
    setPendingFilters((prev) => ({
      ...prev, assigned: v,
      selectedOrgs: v === "unassigned" ? [] : prev.selectedOrgs,
    }));
  }
  function toggleOrg(name: string) {
    setPendingFilters((prev) => {
      const newOrgs = prev.selectedOrgs.includes(name)
        ? prev.selectedOrgs.filter((o) => o !== name)
        : [...prev.selectedOrgs, name];
      return { ...prev, selectedOrgs: newOrgs, assigned: newOrgs.length === 0 ? "all" : prev.assigned };
    });
  }
  function toggleType(t: string) {
    setPendingFilters((prev) => ({
      ...prev, types: prev.types.includes(t) ? prev.types.filter((v) => v !== t) : [...prev.types, t],
    }));
  }
  function applyFilters() { setActiveFilters({ ...pendingFilters }); setPage(1); setFilterOpen(false); }
  function clearAllFilters() { setPendingFilters(EMPTY_FILTERS); setActiveFilters(EMPTY_FILTERS); setPage(1); setFilterOpen(false); }

  function removeOrgTag(key: string) {
    if (key === "unassigned" || key === "known") {
      const u = { ...activeFilters, assigned: "all" as const, selectedOrgs: [] };
      setActiveFilters(u); setPendingFilters(u); setPage(1);
    } else {
      const newOrgs = activeFilters.selectedOrgs.filter((o) => o !== key);
      const u = { ...activeFilters, selectedOrgs: newOrgs, assigned: newOrgs.length === 0 ? "all" as const : activeFilters.assigned };
      setActiveFilters(u); setPendingFilters(u); setPage(1);
    }
  }
  function removeTypeTag(t: string) {
    const u = { ...activeFilters, types: activeFilters.types.filter((v) => v !== t) };
    setActiveFilters(u); setPendingFilters(u); setPage(1);
  }

  // ── Export ────────────────────────────────────────────────────────
  async function handleExport(format: "full" | "mapping") {
    setExportOpen(false);
    try {
      const r = await assetsApi.exportCsv({
        search: search || undefined,
        assigned: activeFilters.assigned === "all" ? undefined : activeFilters.assigned,
        organizations: activeFilters.selectedOrgs.length ? activeFilters.selectedOrgs : undefined,
        types: activeFilters.types.length ? activeFilters.types : undefined,
        snapshotId: selectedSnapshotId ?? undefined,
        format,
      });
      const date = new Date().toISOString().split("T")[0];
      const filename = format === "mapping" ? `url_org_mapping_${date}.csv` : `assets_export_${date}.csv`;
      triggerCsvDownload(r.data as ArrayBuffer, filename);
    } catch {
      toast.error("Export failed");
    }
  }

  // ── Assign panel ─────────────────────────────────────────────────
  function openAssign(asset: { host: string; type: string }) {
    setAssignAsset(asset);
    setAssignDomain(asset.host);
    setAssignOrgSearch("");
    setAssignSelectedOrg(null);
    setAssignOrgDropOpen(false);
    setAssignOpen(true);
  }
  function closeAssign() { setAssignOpen(false); setAssignAsset(null); }

  async function handleCreateNewOrg() {
    const name = assignOrgSearch.trim();
    if (!name) return;
    try {
      const r = await orgsApi.create(name);
      const newOrg = { id: r.data?.id ?? r.id, name: r.data?.name ?? r.name };
      setAllOrgs((prev) => [...prev, newOrg].sort((a, b) => a.name.localeCompare(b.name, "th")));
      setAssignSelectedOrg(newOrg);
      setAssignOrgSearch(newOrg.name);
      setAssignOrgDropOpen(false);
      toast.success(`Organization "${newOrg.name}" created`);
    } catch (e: any) {
      toast.error(`Failed to create org: ${e.response?.data?.error ?? e.message}`);
    }
  }

  async function handleAssignSave() {
    if (!assignSelectedOrg || !assignDomain.trim()) return;
    setAssignSaving(true);
    try {
      await orgsApi.assignAsset({ domain: assignDomain.trim(), organizationId: assignSelectedOrg.id });
      toast.success(`Assigned ${assignDomain.trim()} → ${assignSelectedOrg.name}`);
      closeAssign();
      load();
    } catch (e: any) {
      toast.error(`Error: ${e.response?.data?.error ?? e.message}`);
    } finally { setAssignSaving(false); }
  }

  // ── Derived ───────────────────────────────────────────────────────
  const filteredOrgList = orgPanelSearch
    ? allOrgs.filter((o) => o.name.toLowerCase().includes(orgPanelSearch.toLowerCase()))
    : allOrgs;

  const orgTags: { label: string; key: string }[] =
    activeFilters.assigned === "unassigned" ? [{ label: "Unassigned", key: "unassigned" }]
    : activeFilters.assigned === "known" && activeFilters.selectedOrgs.length === 0 ? [{ label: "Known Only", key: "known" }]
    : activeFilters.selectedOrgs.map((o) => ({ label: o, key: o }));

  const totalFilterCount = orgTags.length + activeFilters.types.length;
  const items: any[] = data?.items ?? [];
  const total: number = data?.total ?? 0;

  const assignFilteredOrgs = assignOrgSearch
    ? allOrgs.filter((o) => o.name.toLowerCase().includes(assignOrgSearch.toLowerCase()))
    : allOrgs;
  const showCreateNew = assignOrgSearch.trim() !== "" &&
    !allOrgs.some((o) => o.name.toLowerCase() === assignOrgSearch.trim().toLowerCase());

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Assets" value={total.toLocaleString()} icon={Server} loading={loading} />
        <KpiCard title="Web" value={data?.kpis?.web ?? "—"} icon={Globe} color="blue" loading={loading} />
        <KpiCard title="DNS" value={data?.kpis?.dns ?? "—"} icon={Server} color="green" loading={loading} />
        <KpiCard title="IP Addresses" value={data?.kpis?.ip ?? "—"} icon={Network} color="orange" loading={loading} />
      </div>

      {/* Search + Filter + Export bar */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9 w-full"
            placeholder="Search by organization or asset/domain..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Filter */}
        <div className="relative" ref={filterRef}>
          <button
            className="btn-secondary flex items-center gap-1.5"
            onClick={() => { setPendingFilters({ ...activeFilters }); setOrgPanelSearch(""); setFilterOpen((o) => !o); }}
          >
            <Filter className="w-4 h-4" />
            {totalFilterCount > 0 ? `Filter (${totalFilterCount})` : "Filter"}
          </button>

          {filterOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 flex flex-col">
              <div className="p-4 space-y-5 overflow-y-auto" style={{ maxHeight: "480px" }}>
                {/* Org Assignment */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Org Assignment</p>
                  <div className="space-y-1.5">
                    {(["all", "known", "unassigned"] as Assigned[]).map((v) => (
                      <label key={v} className="flex items-center gap-2 cursor-pointer group">
                        <input type="radio" name="assigned" value={v} checked={pendingFilters.assigned === v}
                          onChange={() => setAssigned(v)} className="border-gray-300 text-blue-600" />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900">
                          {v === "all" ? "All" : v === "known" ? "Known Org" : "Unassigned"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Select Organization */}
                {pendingFilters.assigned !== "unassigned" && (
                  <div>
                    <div className="border-t border-gray-100 -mx-4 mb-4" />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Select Organization</p>
                    <div className="relative mb-2">
                      <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
                      <input className="input pl-8 text-xs py-1.5 w-full" placeholder="Search org..."
                        value={orgPanelSearch} onChange={(e) => setOrgPanelSearch(e.target.value)} />
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {filteredOrgList.length === 0 && <p className="text-xs text-gray-400">No results</p>}
                      {filteredOrgList.map((org) => (
                        <label key={org.id} className="flex items-center gap-2 cursor-pointer group">
                          <input type="checkbox" checked={pendingFilters.selectedOrgs.includes(org.name)}
                            onChange={() => toggleOrg(org.name)} className="rounded border-gray-300 text-blue-600" />
                          <span className="text-sm text-gray-700 truncate group-hover:text-gray-900">{org.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Type */}
                <div>
                  <div className="border-t border-gray-100 -mx-4 mb-4" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Type</p>
                  <div className="space-y-1.5">
                    {ASSET_TYPE_OPTIONS.map(({ value, label }) => (
                      <label key={value} className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={pendingFilters.types.includes(value)}
                          onChange={() => toggleType(value)} className="rounded border-gray-300 text-blue-600" />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between shrink-0">
                <button className="text-sm text-gray-500 hover:text-gray-800 transition-colors" onClick={clearAllFilters}>Clear All</button>
                <button className="btn-primary text-sm py-1.5 px-4" onClick={applyFilters}>Apply</button>
              </div>
            </div>
          )}
        </div>

        {/* Export */}
        <div className="relative" ref={exportRef}>
          <button
            className="btn-secondary flex items-center gap-1.5"
            onClick={() => setExportOpen((o) => !o)}
          >
            <Download className="w-4 h-4" />
            Export
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1">
              <button onClick={() => handleExport("full")}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                Export Full Table
              </button>
              <button onClick={() => handleExport("mapping")}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                Export URL + Org Mapping
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Active filter tags */}
      {totalFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 px-0.5">
          {orgTags.map((tag) => (
            <span key={tag.key} className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
              Org: {tag.label}
              <button onClick={() => removeOrgTag(tag.key)} className="p-0.5 hover:bg-blue-100 rounded-full transition-colors"><X className="w-3 h-3" /></button>
            </span>
          ))}
          {activeFilters.types.map((t) => (
            <span key={`type-${t}`} className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-purple-50 text-purple-700 text-xs rounded-full font-medium">
              Type: {ASSET_TYPE_DISPLAY[t]?.label ?? t}
              <button onClick={() => removeTypeTag(t)} className="p-0.5 hover:bg-purple-100 rounded-full transition-colors"><X className="w-3 h-3" /></button>
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                <SortableHeader label="Asset / Domain" field="host"         currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Type"           field="type"         currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Organization"   field="organization" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Issues"         field="issueCount"   currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} align="right" />
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3">
                    <div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No assets found</td></tr>
              ) : (
                items.map((asset: any, i: number) => (
                  <tr key={asset.host ?? i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400 text-xs">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{asset.host}</td>
                    <td className="px-4 py-3">
                      {(() => {
                        const d = ASSET_TYPE_DISPLAY[asset.type];
                        return (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${d?.style ?? "text-gray-600 bg-gray-100"}`}>
                            {d?.label ?? asset.type}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {asset.organization
                        ? asset.organization
                        : <span className="italic text-gray-400">unassigned</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      <span className="text-red-600">{asset.issueCount}</span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      {canEdit && !asset.organization && (
                        <button
                          onClick={() => openAssign({ host: asset.host, type: asset.type })}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                          title="Assign Organization"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 border-t border-gray-100">
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={(p) => setPage(p)} />
        </div>
      </div>

      {/* ── Assign Org Slide-in Panel ─────────────────────────────────── */}
      {assignOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/20" onClick={closeAssign} />
          {/* Panel */}
          <div className="relative w-80 h-full bg-white shadow-2xl flex flex-col z-50 animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Assign Organization</h2>
              <button onClick={closeAssign} className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              {/* Asset field */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Asset</label>
                <input
                  className="input w-full text-sm"
                  value={assignDomain}
                  onChange={(e) => setAssignDomain(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {(() => {
                    const d = ASSET_TYPE_DISPLAY[assignAsset?.type ?? ""];
                    return (
                      <>Auto-detected type: <span className={`font-medium px-1.5 py-0.5 rounded text-xs ${d?.style ?? "text-gray-600 bg-gray-100"}`}>{d?.label ?? assignAsset?.type}</span></>
                    );
                  })()}
                </p>
              </div>

              {/* Organization search */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Organization</label>
                <div className="relative" ref={assignOrgRef}>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                    <input
                      className="input pl-8 w-full text-sm"
                      placeholder="Search org..."
                      value={assignOrgSearch}
                      onChange={(e) => { setAssignOrgSearch(e.target.value); setAssignOrgDropOpen(true); setAssignSelectedOrg(null); }}
                      onFocus={() => setAssignOrgDropOpen(true)}
                    />
                    {assignSelectedOrg && (
                      <span className="absolute right-2.5 top-2 text-xs text-blue-600 font-medium pointer-events-none">✓</span>
                    )}
                  </div>
                  {assignOrgDropOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto z-10">
                      {assignFilteredOrgs.map((org) => (
                        <button key={org.id}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors ${assignSelectedOrg?.id === org.id ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                          onClick={() => { setAssignSelectedOrg(org); setAssignOrgSearch(org.name); setAssignOrgDropOpen(false); }}
                        >
                          {org.name}
                        </button>
                      ))}
                      {showCreateNew && (
                        <button
                          className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-1.5 border-t border-gray-100"
                          onClick={handleCreateNewOrg}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Create &ldquo;{assignOrgSearch.trim()}&rdquo;
                        </button>
                      )}
                      {assignFilteredOrgs.length === 0 && !showCreateNew && (
                        <p className="px-3 py-2 text-sm text-gray-400">No organizations found</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 flex gap-2 justify-end">
              <button className="btn-secondary text-sm py-1.5 px-4" onClick={closeAssign}>Cancel</button>
              <button
                className="btn-primary text-sm py-1.5 px-4 disabled:opacity-50"
                onClick={handleAssignSave}
                disabled={assignSaving || !assignSelectedOrg || !assignDomain.trim()}
              >
                {assignSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
