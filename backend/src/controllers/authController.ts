import type { Request, Response } from "express";
import { AUTH_MODE, DEV_ROLE, SSO_APP_ID, SSO_LOGIN_URL, SSO_LOGOUT_URL, SSO_REDIRECT_URL, ADMIN_EMAILS } from "../config.ts";
import { exchangeCodeForToken, fetchUserProfile } from "../services/sso.service.ts";
import { writeAuditLog } from "../services/logService.ts";
import prisma from "../lib/prisma.ts";
import { authenticator } from "otplib";
import qrcode from "qrcode";
import { encrypt, decrypt } from "../utils/crypto.ts";

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

    if (user.twoFactorEnabled) {
      if (req.session) {
        req.session.preAuthProfile = {
          id: user.id,
          email: user.email,
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          role: user.role,
          facultyName: user.facultyName ?? "",
          accessToken: tokenData.accessToken,
        };
      }
      return res.redirect("/login/2fa");
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
    return res.redirect("/dashboard");
  } catch (err: any) {
    console.error("[SSO] Callback exception:", err.message);
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

export async function setup2Fa(req: Request, res: Response) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const secret = authenticator.generateSecret();
    const encryptedSecret = encrypt(secret);
    
    await prisma.user.update({
      where: { id: req.user.id },
      data: { twoFactorSecret: encryptedSecret },
    });

    const otpauth = authenticator.keyuri(req.user.email, "Security Scorecard", secret);
    const qrCodeUrl = await qrcode.toDataURL(otpauth);
    res.json({ success: true, qrCodeUrl });
  } catch (error: any) {
    console.error("[2FA] Setup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function verifySetup2Fa(req: Request, res: Response) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ error: "2FA setup has not been initiated" });
    }

    const secret = decrypt(user.twoFactorSecret);
    const isValid = authenticator.verify({ token, secret });
    if (!isValid) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: { twoFactorEnabled: true },
    });

    await writeAuditLog(req.user.id, "2FA_ENABLE").catch(() => undefined);
    res.json({ success: true, message: "2FA activated successfully" });
  } catch (error: any) {
    console.error("[2FA] Verify setup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function disable2Fa(req: Request, res: Response) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    await prisma.user.update({
      where: { id: req.user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
    await writeAuditLog(req.user.id, "2FA_DISABLE").catch(() => undefined);
    res.json({ success: true, message: "2FA disabled successfully" });
  } catch (error: any) {
    console.error("[2FA] Disable error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function login2Fa(req: Request, res: Response) {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    const preAuth = req.session?.preAuthProfile;
    if (!preAuth || !preAuth.id) {
      return res.status(400).json({ error: "No pending 2FA login session found" });
    }

    const user = await prisma.user.findUnique({ where: { id: preAuth.id } });
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ error: "User not found or 2FA not set up" });
    }

    const secret = decrypt(user.twoFactorSecret);
    const isValid = authenticator.verify({ token, secret });
    if (!isValid) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    req.session.userId = String(preAuth.id);
    req.session.accessToken = preAuth.accessToken;
    req.session.userProfile = {
      id: preAuth.id,
      email: preAuth.email,
      firstName: preAuth.firstName,
      lastName: preAuth.lastName,
      role: preAuth.role,
      facultyName: preAuth.facultyName,
    };
    req.session.lastAuthCheck = Date.now();
    delete req.session.preAuthProfile;

    await writeAuditLog(user.id, "2FA_LOGIN_SUCCESS").catch(() => undefined);
    res.json({ success: true, message: "Logged in successfully" });
  } catch (error: any) {
    console.error("[2FA] Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
