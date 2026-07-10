"use client";

import { useEffect, useState } from "react";
import { Key, Plus, Trash2, Copy, CheckCircle2 } from "lucide-react";
import { adminApi } from "@/lib/api";

type ApiKey = {
  id: number;
  key: string;
  name: string;
  isActive: boolean;
  createdAt: string;
};

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getApiKeys();
      setKeys(res.keys || []);
    } catch (err) {
      console.error("Failed to fetch API keys", err);
      alert("Failed to load API keys.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleGenerateKey = async () => {
    const name = prompt("Enter a name for the new API Key (e.g., 'Web App', 'Faculty of Science'):");
    if (!name) return;

    try {
      const res = await adminApi.generateApiKey(name);
      if (res.success) {
        alert(`API Key Generated: ${res.apiKey}\n\nPlease copy this immediately.`);
        fetchKeys();
      }
    } catch (err) {
      console.error("Failed to generate key", err);
      alert("Failed to generate API Key.");
    }
  };

  const handleDelete = async (id: number, keyStr: string) => {
    if (!confirm(`Are you sure you want to revoke and delete the API Key: ${keyStr}?`)) return;

    try {
      const res = await adminApi.deleteApiKey(id);
      if (res.success) {
        fetchKeys();
      }
    } catch (err) {
      console.error("Failed to delete key", err);
      alert("Failed to delete API Key.");
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Key className="w-6 h-6 text-blue-500" />
            API Key Management
          </h1>
          <p className="text-slate-500 mt-1">Manage public and master API keys for external integrations.</p>
        </div>
        <button
          onClick={handleGenerateKey}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Generate New Key
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4">Key Name</th>
                <th className="px-6 py-4">API Key (Hash)</th>
                <th className="px-6 py-4">Created At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-500">Loading...</td>
                </tr>
              ) : keys.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-500">No API Keys found. Create one to get started.</td>
                </tr>
              ) : (
                keys.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{k.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400 font-mono text-xs">
                          {k.key}
                        </code>
                        <button
                          onClick={() => handleCopy(k.key)}
                          className="text-slate-400 hover:text-blue-500 transition-colors"
                          title="Copy to clipboard"
                        >
                          {copiedKey === k.key ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(k.createdAt).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(k.id, k.key)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Revoke Key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
