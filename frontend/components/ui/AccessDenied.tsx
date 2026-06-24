"use client";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function AccessDenied({ requiredRoles }: { requiredRoles?: string[] }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-20">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-5">
        <ShieldAlert className="w-8 h-8 text-red-500" />
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-gray-500 max-w-md mb-1">
        You don&apos;t have permission to view this page.
      </p>
      {requiredRoles && requiredRoles.length > 0 && (
        <p className="text-sm text-gray-400 mb-6">
          Required role: <span className="font-medium text-gray-600">{requiredRoles.join(" or ")}</span>
        </p>
      )}
      <Link href="/dashboard" className="btn-primary">Back to Dashboard</Link>
    </div>
  );
}
