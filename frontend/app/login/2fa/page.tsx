"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { authApi } from "@/lib/api";

export default function Login2FaPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authApi.login2Fa(code);
      window.location.href = "/dashboard";
    } catch (e: any) {
      setError(e.response?.data?.error ?? "Invalid authentication code");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 to-brand-700 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-brand-800 flex items-center justify-center mb-4">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Two-Factor Authentication</h1>
          <p className="text-sm text-gray-500 mt-1 text-center">
            Enter the 6-digit verification code from your authenticator app
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <input 
              type="text" 
              required
              maxLength={6}
              pattern="[0-9]*"
              inputMode="numeric"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full text-center tracking-widest text-2xl font-mono px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="000000"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify Code"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => router.push("/login")}
          className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 text-center block"
        >
          Back to login
        </button>
      </div>
    </div>
  );
}
