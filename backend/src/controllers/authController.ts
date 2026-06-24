import type { Request, Response } from "express";
import { AUTH_MODE, DEV_ROLE, SSO_APP_ID, SSO_LOGIN_URL, SSO_LOGOUT_URL, SSO_REDIRECT_URL, ADMIN_EMAILS } from "../config.ts";
import { exchangeCodeForToken, fetchUserProfile } from "../services/sso.service.ts";
import { writeAuditLog } from "../services/logService.ts";
import prisma from "../lib/prisma.ts";

export async function login(req: Request, res: Response) {
  if (AUTH_MODE === "DEV") {
    req.session.userId = "dev-admin";
    req.session.accessToken = `dev-token-${Date.now()}`;
    req.session.userProfile = {
      id: 1,
      email: "dev.admin@kku.ac.th",
      firstName: "Dev",
      lastName: "Admin",
      role: DEV_ROLE,
      facultyName: "System",
    };
    await writeAuditLog(1, "DEV_LOGIN").catch(() => undefined);
    return res.json({ success: true, user: req.session.userProfile });
  }

  if (AUTH_MODE === "SSO") {
    const loginUrl = `${SSO_LOGIN_URL}?app=${SSO_APP_ID}&redirect=${encodeURIComponent(SSO_REDIRECT_URL)}`;
    return res.json({ success: true, redirectUrl: loginUrl });
  }

  return res.status(500).json({ error: "Invalid AUTH_MODE" });
}

export async function callback(req: Request, res: Response) {
  try {
    const { code, error } = req.query as Record<string, string>;

    if (error) {
      console.error("[SSO] Callback error:", error, req.query.error_description);
      return res.redirect(`/login?error=${encodeURIComponent(error)}`);
    }
    if (!code) {
      return res.redirect("/login?error=missing_code");
    }

    const tokenData = await exchangeCodeForToken(code);
    if (!tokenData.accessToken) {
      console.error("[SSO] Token exchange failed, response:", tokenData);
      return res.redirect("/login?error=token_failed");
    }

    const profile = await fetchUserProfile(tokenData.accessToken);
    const email = (profile.email ?? tokenData.email ?? "").toLowerCase();
    if (!email) {
      return res.redirect("/login?error=missing_email");
    }

    const isAdminEmail = ADMIN_EMAILS.includes(email);

    let user: Awaited<ReturnType<typeof prisma.user.upsert>>;

    if (isAdminEmail) {
      // Always upsert admin emails as ADMIN + ACTIVE (cannot be blocked)
      user = await prisma.user.upsert({
        where: { email },
        update: {
          role: "ADMIN",
          status: "ACTIVE",
          firstName: profile.firstName ?? undefined,
          lastName: profile.lastName ?? undefined,
          employeeId: profile.employeeId ?? undefined,
          facultyName: profile.facultyName ?? undefined,
        },
        create: {
          email,
          role: "ADMIN",
          status: "ACTIVE",
          employeeId: profile.employeeId ?? undefined,
          firstName: profile.firstName ?? undefined,
          lastName: profile.lastName ?? undefined,
          facultyName: profile.facultyName ?? undefined,
        },
      });
    } else {
      // Unknown email → block immediately (admin must pre-register)
      const existing = await prisma.user.findUnique({ where: { email } });
      if (!existing) {
        return res.redirect("/login?error=" + encodeURIComponent("Access denied. Contact administrator."));
      }
      if (existing.status === "BANNED") {
        return res.redirect("/login?error=" + encodeURIComponent("Your account has been banned."));
      }
      if (existing.status === "PENDING") {
        return res.redirect("/login?error=" + encodeURIComponent("Your account is awaiting approval."));
      }
      // ACTIVE — update profile fields from SSO
      user = await prisma.user.update({
        where: { email },
        data: {
          firstName: profile.firstName ?? undefined,
          lastName: profile.lastName ?? undefined,
          employeeId: profile.employeeId ?? undefined,
          facultyName: profile.facultyName ?? undefined,
        },
      });
    }

    req.session.userId = String(user.id);
    req.session.accessToken = tokenData.accessToken;
    req.session.lastAuthCheck = Date.now();
    req.session.userProfile = {
      id: user.id,
      email: user.email,
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      role: user.role,
      facultyName: user.facultyName ?? "",
    };

    await writeAuditLog(user.id, "SSO_LOGIN").catch(() => undefined);

    // Redirect browser to the frontend dashboard (relative — resolves to current origin)
    return res.redirect("/dashboard");
  } catch (err: any) {
    console.error("[SSO] Callback exception:", err.message);
    console.error("[SSO] Response status:", err.response?.status);
    console.error("[SSO] Response data:", JSON.stringify(err.response?.data, null, 2));
    console.error("[SSO] Request URL:", err.config?.url);
    console.error("[SSO] Request body:", err.config?.data);
    return res.redirect(`/login?error=${encodeURIComponent(err.message ?? "sso_error")}`);
  }
}

export async function logout(req: Request, res: Response) {
  await writeAuditLog(req.user?.id ?? null, "LOGOUT").catch(() => undefined);
  req.session.destroy(() => undefined);
  if (AUTH_MODE === "SSO") {
    return res.json({ success: true, redirectUrl: `${SSO_LOGOUT_URL}?app=${SSO_APP_ID}` });
  }
  return res.json({ success: true });
}

export function getMe(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  return res.json({ success: true, user: req.user, authMode: AUTH_MODE });
}
