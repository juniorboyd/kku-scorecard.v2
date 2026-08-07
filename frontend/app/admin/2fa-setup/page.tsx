"use client";
import { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, CheckCircle, RefreshCw } from "lucide-react";
import { authApi } from "@/lib/api";
import { useToast } from "@/lib/toast";

export default function TwoFactorSetupPage() {
  const toast = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [token, setToken] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [settingUp, setSettingUp] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    setLoading(true);
    try {
      const data = await authApi.me();
      setUser(data.user);
    } catch (err) {
      toast.error("Failed to load user profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleSetup() {
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

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    try {
      await authApi.verify2Fa(token);
      toast.success("2FA enabled successfully!");
      setQrCodeUrl("");
      setToken("");
      loadUser();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Verification failed");
    } finally {
      setVerifying(false);
    }
  }

  async function handleDisable() {
    if (!confirm("Are you sure you want to disable 2FA? This decreases account security.")) return;
    setLoading(true);
    try {
      await authApi.disable2Fa();
      toast.success("2FA has been disabled");
      loadUser();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Failed to disable 2FA");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-brand-50 rounded-xl">
          <ShieldCheck className="w-8 h-8 text-brand-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Two-Factor Authentication (2FA)</h1>
          <p className="text-sm text-gray-500">Secure your account with an Authenticator app (TOTP)</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {user?.twoFactorEnabled ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">2FA is currently active</h2>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              Your account is secured. You will be prompted to enter a 6-digit code from your authenticator app every time you log in.
            </p>
            <button
              onClick={handleDisable}
              className="mt-8 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-colors text-sm"
            >
              Disable 2FA
            </button>
          </div>
        ) : (
          <div>
            {qrCodeUrl ? (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-lg font-bold text-gray-900">Scan QR Code</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Scan the QR code below using your authenticator app (e.g. Google Authenticator)
                  </p>
                </div>

                <div className="flex justify-center bg-gray-50 p-6 rounded-2xl max-w-xs mx-auto border border-gray-100">
                  <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                </div>

                <form onSubmit={handleVerify} className="max-w-xs mx-auto space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider text-center mb-2">
                      Enter the 6-digit code to verify
                    </label>
                    <input 
                      type="text"
                      required
                      maxLength={6}
                      pattern="[0-9]*"
                      inputMode="numeric"
                      value={token}
                      onChange={e => setToken(e.target.value.replace(/\D/g, ""))}
                      className="w-full text-center tracking-widest text-2xl font-mono px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="000000"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setQrCodeUrl("")}
                      className="w-1/2 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={verifying || token.length !== 6}
                      className="w-1/2 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-colors text-sm disabled:opacity-50"
                    >
                      {verifying ? "Verifying..." : "Verify"}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-8 h-8 text-yellow-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">2FA is not enabled</h2>
                <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                  Adding 2FA makes your account significantly more secure by requiring a second verification step during login.
                </p>
                <button
                  onClick={handleSetup}
                  disabled={settingUp}
                  className="mt-8 px-6 py-3 bg-brand-800 hover:bg-brand-900 text-white font-medium rounded-xl transition-colors text-sm flex items-center justify-center mx-auto"
                >
                  {settingUp ? "Initializing..." : "Setup 2FA"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
