"use client";
import { useEffect, useState, useCallback } from "react";
import { Users, UserCheck, Clock, Ban, Plus, Trash2 } from "lucide-react";
import { adminApi } from "@/lib/api";
import { useToast } from "@/lib/toast";
import KpiCard from "@/components/ui/KpiCard";
import Pagination from "@/components/ui/Pagination";
import SortableHeader from "@/components/ui/SortableHeader";

const PAGE_SIZE = 20;

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  BANNED: "bg-red-100 text-red-700",
};

const ROLES = ["VIEWER", "ANALYST", "ADMIN"];
const STATUSES = ["ACTIVE", "PENDING", "BANNED"];

export default function AdminUsersPage() {
  const toast = useToast();
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Add user form
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("VIEWER");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminApi.listUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        sortBy,
        sortOrder,
      });
      setData(r);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => { load(); }, [load]);

  function handleSort(field: string) {
    if (field === sortBy) { setSortOrder((o) => o === "asc" ? "desc" : "asc"); }
    else { setSortBy(field); setSortOrder(field === "createdAt" ? "desc" : "asc"); }
    setPage(1);
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAdding(true);
    try {
      const email = newEmail.trim();
      await adminApi.createUser({ email, role: newRole });
      setNewEmail("");
      setNewRole("VIEWER");
      toast.success(`User ${email} added`);
      load();
    } catch (err: any) {
      const msg = err.response?.data?.error ?? "Failed to add user";
      setAddError(msg);
      toast.error(msg);
    } finally {
      setAdding(false);
    }
  }

  async function handleRoleChange(id: number, role: string) {
    setActionLoading(id);
    try {
      await adminApi.updateRole(id, role);
      toast.success(`Role changed to ${role}`);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.error ?? e.message);
    } finally { setActionLoading(null); }
  }

  async function handleStatusToggle(id: number, currentStatus: string) {
    const next = currentStatus === "ACTIVE" ? "BANNED" : "ACTIVE";
    setActionLoading(id);
    try {
      await adminApi.updateStatus(id, next);
      toast.success(next === "BANNED" ? "User banned" : "User activated");
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.error ?? e.message);
    } finally { setActionLoading(null); }
  }

  async function handleDelete(id: number, email: string) {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    setActionLoading(id);
    try {
      await adminApi.deleteUser(id);
      toast.deleted(`User ${email} deleted`);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.error ?? e.message);
    } finally { setActionLoading(null); }
  }

  const items: any[] = data?.items ?? [];
  const total: number = data?.total ?? 0;
  const kpi = data?.kpi;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Users" value={kpi?.totalUsers ?? "—"} icon={Users} color="blue" />
        <KpiCard title="Active" value={kpi?.activeCount ?? "—"} icon={UserCheck} color="green" />
        <KpiCard title="Pending" value={kpi?.pendingCount ?? "—"} icon={Clock} color="yellow" />
        <KpiCard title="Banned" value={kpi?.bannedCount ?? "—"} icon={Ban} color="red" />
      </div>

      {/* Add User */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Add User</h2>
        <form onSubmit={handleAddUser} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs text-gray-500 mb-1">Email</label>
            <input
              type="email"
              required
              className="input w-full"
              placeholder="user@kkumail.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Role</label>
            <select className="input" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button type="submit" disabled={adding} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {adding ? "Adding..." : "Add User"}
          </button>
        </form>
        {addError && <p className="mt-2 text-sm text-red-600">{addError}</p>}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <input
          className="input flex-1 min-w-[180px]"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select className="input w-36" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="input w-36" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <SortableHeader label="Email"    field="email"     currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label="Name"     field="name"      currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                <SortableHeader label="Status"   field="status"    currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Faculty</th>
                <SortableHeader label="Added At" field="createdAt" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No users found</td></tr>
              ) : (
                items.map((u: any) => {
                  const busy = actionLoading === u.id;
                  const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || "—";
                  return (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700 text-xs font-medium">{u.email}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{name}</td>
                      <td className="px-4 py-3">
                        <select
                          className="input py-0.5 text-xs"
                          value={u.role}
                          disabled={busy}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        >
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[u.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{u.facultyName ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(u.createdAt).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            disabled={busy}
                            onClick={() => handleStatusToggle(u.id, u.status)}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                              u.status === "ACTIVE"
                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                : u.status === "PENDING"
                                ? "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                                : "bg-green-50 text-green-600 hover:bg-green-100"
                            }`}
                          >
                            {u.status === "ACTIVE" ? "Ban" : u.status === "PENDING" ? "Activate" : "Unban"}
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => handleDelete(u.id, u.email)}
                            className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 border-t border-gray-100">
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}
