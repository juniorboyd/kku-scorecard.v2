"use client";
import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, ShieldAlert, Save, UserCircle, Loader2 } from "lucide-react";
import { settingsApi } from "@/lib/api";
import { useMe } from "@/lib/me";
import { useToast } from "@/lib/toast";

const ROLE_BADGE: Record<string, string> = {
  ADMIN:   "bg-red-100 text-red-700",
  ANALYST: "bg-blue-100 text-blue-700",
  VIEWER:  "bg-gray-100 text-gray-600",
};

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-800">{value || "—"}</p>
    </div>
  );
}

export default function SettingsPage() {
  const me = useMe();
  const toast = useToast();
  const isAdmin = me?.role === "ADMIN";

  const fullName = [me?.firstName, me?.lastName].filter(Boolean).join(" ").trim();

  // API key section (ADMIN only)
  const [masked, setMasked] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loadingKey, setLoadingKey] = useState(true);
  const [saving, setSaving] = useState(false);
  const [keyError, setKeyError] = useState("");

  useEffect(() => {
    if (!isAdmin) { setLoadingKey(false); return; }
    settingsApi.getScorecardKey()
      .then((r) => { setMasked(r.masked ?? null); setConfigured(!!r.configured); })
      .catch(() => {})
      .finally(() => setLoadingKey(false));
  }, [isAdmin]);

  async function handleSave() {
    if (!apiKey.trim()) return;
    setSaving(true);
    setKeyError("");
    try {
      const r = await settingsApi.updateScorecardKey(apiKey.trim());
      setMasked(r.masked ?? null);
      setConfigured(true);
      setApiKey("");
      setShowKey(false);
      toast.success("API Key saved and validated ✓");
    } catch (e: any) {
      setKeyError(e.response?.data?.error ?? e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Section 1: Profile (read-only, from SSO) */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserCircle className="w-5 h-5 text-brand-800" />
          <h2 className="text-sm font-semibold text-gray-800">Profile</h2>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Full Name" value={fullName} />
          <Field label="Email" value={me?.email} />
          <Field label="Faculty" value={me?.facultyName} />
          <div>
            <p className="text-xs text-gray-500 mb-1">Role</p>
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[me?.role ?? ""] ?? "bg-gray-100 text-gray-600"}`}>
              {me?.role ?? "—"}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-4">This information is pulled from SSO and cannot be edited</p>
      </div>

      {/* Section 2: SecurityScorecard API Key (ADMIN only) */}
      {isAdmin && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound className="w-5 h-5 text-brand-800" />
            <h2 className="text-sm font-semibold text-gray-800">SecurityScorecard API Key</h2>
          </div>

          {!loadingKey && (
            <p className="text-xs text-gray-500 mb-3">
              {configured
                ? <>Current key: <span className="font-mono text-gray-700">{masked}</span></>
                : "API Key not configured"}
            </p>
          )}

          <label className="text-sm text-gray-600 mb-1 block">
            {configured ? "Change API Key" : "Set API Key"}
          </label>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              className="input w-full pr-10"
              placeholder="Paste new API Key here"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowKey((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              title={showKey ? "Hide" : "Show"}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {keyError && <p className="text-sm text-red-600 mt-2">{keyError}</p>}

          <div className="flex items-start gap-2 mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            API Key is stored in the database (AES-256-GCM encrypted) — do not share with others
          </div>

          <div className="flex justify-end mt-4">
            <button className="btn-primary" onClick={handleSave} disabled={saving || !apiKey.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Validating..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
