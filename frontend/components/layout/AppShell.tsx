"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authApi } from "@/lib/api";
import { SnapshotProvider } from "@/lib/snapshotContext";
import { ToastProvider } from "@/lib/toast";
import { MeContext, type Me } from "@/lib/me";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import NewDataBanner from "./NewDataBanner";
import AccessDenied from "@/components/ui/AccessDenied";

const PUBLIC_PATHS = ["/login"];
const PUBLIC_EXACT = ["/"];

// Routes restricted to specific roles. This is the universal client-side guard
// (works in dev + prod). The backend's requireRole() is the real enforcement;
// this just avoids showing broken pages and silent 401s to the wrong role.
const ROUTE_ROLES: { prefix: string; roles: string[] }[] = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/imports", roles: ["ADMIN", "ANALYST"] },
  // /logs guards itself (redirects VIEWER to /dashboard) in app/logs/page.tsx.
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_EXACT.includes(path) || PUBLIC_PATHS.some((p) => path.startsWith(p));
  const [me, setMe] = useState<Me>(null);
  const [status, setStatus] = useState<"loading" | "authed" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (isPublic) return;
    authApi.me()
      .then((r) => { setMe(r.user ?? null); setStatus("authed"); })
      .catch(() => {
        router.push("/login");
      });
  }, [isPublic, router]);

  if (isPublic) return <>{children}</>;

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#1e3a5f", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-6 text-center text-red-800">
        <div>
          <h2 className="text-xl font-bold mb-2">Authentication Failed</h2>
          <p>{errorMsg}</p>
        </div>
      </div>
    );
  }

  const restriction = ROUTE_ROLES.find((r) => path.startsWith(r.prefix));
  const allowed = !restriction || (!!me?.role && restriction.roles.includes(me.role));

  return (
    <MeContext.Provider value={me}>
      <SnapshotProvider>
        <ToastProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Topbar />
              <main className="flex-1 overflow-y-auto p-6">
                {allowed && <NewDataBanner />}
                {allowed ? children : <AccessDenied requiredRoles={restriction!.roles} />}
              </main>
            </div>
          </div>
        </ToastProvider>
      </SnapshotProvider>
    </MeContext.Provider>
  );
}
