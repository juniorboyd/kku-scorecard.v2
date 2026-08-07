"use client";
import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, ShieldAlert, Save, UserCircle, Loader2, ShieldCheck, CheckCircle } from "lucide-react";
import { settingsApi, authApi } from "@/lib/api";
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

  // 2FA state
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [token, setToken] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [settingUp, setSettingUp] = useState(false);

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

  async function handleSetup2Fa() {
    setSettingUp(true);
    try {
      const data = await authApi.setup2Fa();
      setQrCodeUrl(data.qrCodeUrl);
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Failed to initialize 2FA setup");
    } finally {
      setSettingUp(false);
    }
  }

  async function handleVerify2Fa(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    try {
      await authApi.verify2Fa(token);
      toast.success("2FA enabled successfully!");
      setQrCodeUrl("");
      setToken("");
      window.location.reload(); // Reload to refresh global user state
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Verification failed");
    } finally {
      setVerifying(false);
    }
  }

  async function handleDisable2Fa() {
    if (!confirm("Are you sure you want to disable 2FA? This decreases account security.")) return;
    try {
      await authApi.disable2Fa();
      toast.success("2FA has been disabled");
      window.location.reload(); // Reload to refresh global user state
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Failed to disable 2FA");
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

      {/* Section 2: Two-Factor Authentication (2FA) */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-brand-800" />
          <h2 className="text-sm font-semibold text-gray-800">Two-Factor Authentication (2FA)</h2>
        </div>

        {me?.twoFactorEnabled ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950/30 p-3 rounded-lg border border-green-200 dark:border-green-900/50">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-xs font-medium">2FA is currently active and protecting your account.</span>
            </div>
            <button
              onClick={handleDisable2Fa}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-medium rounded-xl transition-colors text-xs"
            >
              Disable 2FA
            </button>
          </div>
        ) : (
          <div>
            {qrCodeUrl ? (
              <div className="space-y-4 max-w-xs">
                <p className="text-xs text-slate-500">
                  Scan the QR code below using your authenticator app (e.g. Google Authenticator) and enter the 6-digit code.
                </p>
                <div className="flex justify-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <img src={qrCodeUrl} alt="2FA QR Code" className="w-40 h-40" />
                </div>
                <form onSubmit={handleVerify2Fa} className="space-y-3">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-center tracking-widest text-xl font-mono px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="000000"
                  />
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setQrCodeUrl("")}
                      className="w-1/2 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={verifying || token.length !== 6}
                      className="w-1/2 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-colors text-xs disabled:opacity-50"
                    >
                      {verifying ? "Verifying..." : "Verify"}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-gray-500 max-w-md">
                  Add an extra layer of security to your account. Once enabled, you will be prompted to enter a 6-digit verification code from your authenticator app during login.
                </p>
                <button
                  onClick={handleSetup2Fa}
                  disabled={settingUp}
                  className="px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white font-medium rounded-xl transition-colors text-xs flex items-center gap-1.5"
                >
                  {settingUp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {settingUp ? "Initializing..." : "Setup 2FA"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 3: SecurityScorecard API Key (ADMIN only) */}
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
