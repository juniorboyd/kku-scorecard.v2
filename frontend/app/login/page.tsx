"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, LogIn } from "lucide-react";
import { authApi } from "@/lib/api";

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const params = useSearchParams();

  useEffect(() => {
    const err = params.get("error");
    if (err) setError(decodeURIComponent(err));
  }, [params]);

  async function handleLogin() {
    setLoading(true);
    setError("");
    try {
      const r = await authApi.login();
      if (r.redirectUrl) {
        window.location.href = r.redirectUrl;
      } else {
        window.location.href = "/dashboard";
      }
    } catch (e: any) {
      setError(e.response?.data?.error ?? "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 to-brand-700 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-brand-800 flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">KKU Security Score</h1>
          <p className="text-sm text-gray-500 mt-1">Khon Kaen University</p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="btn-primary w-full justify-center py-3 text-base"
        >
          <LogIn className="w-5 h-5" />
          {loading ? "Redirecting to KKU SSO..." : "Sign in with KKU SSO"}
        </button>

        <p className="text-xs text-center text-gray-400 mt-6">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-brand-900 to-brand-700" />}>
      <LoginContent />
    </Suspense>
  );
}
