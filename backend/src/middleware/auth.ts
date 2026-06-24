import type { Request, Response, NextFunction } from "express";
import { AUTH_MODE, DEV_ROLE } from "../config.ts";
import { verifyAuthStatus } from "../services/sso.service.ts";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id?: number;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        facultyName?: string;
        [key: string]: any;
      };
    }
  }
}

declare module "express-session" {
  interface SessionData {
    userId?: string;
    accessToken?: string;
    lastAuthCheck?: number;
    userProfile?: {
      id?: number;
      email?: string;
      firstName?: string;
      lastName?: string;
      role?: string;
      facultyName?: string;
      [key: string]: any;
    };
  }
}

export const DEV_USER: { id: number; email: string; firstName: string; lastName: string; role: string; facultyName: string } = {
  id: 0,
  email: "dev.admin@kku.ac.th",
  firstName: "Dev",
  lastName: "Admin",
  role: DEV_ROLE,
  facultyName: "System",
};

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (AUTH_MODE === "DEV") {
    req.user = DEV_USER;
    return next();
  }

  if (AUTH_MODE === "SSO") {
    const token = req.session?.accessToken;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const now = Date.now();
    const lastCheck = req.session.lastAuthCheck ?? 0;
    if (now - lastCheck > 30 * 60 * 1000) {
      const valid = await verifyAuthStatus(token);
      if (!valid) {
        req.session.destroy(() => undefined);
        return res.status(401).json({ error: "Session expired" });
      }
      req.session.lastAuthCheck = now;
    }

    const profile = req.session?.userProfile;
    if (!profile?.id) return res.status(401).json({ error: "Not authenticated" });

    req.user = {
      id: profile.id,
      email: profile.email ?? "",
      firstName: profile.firstName ?? "",
      lastName: profile.lastName ?? "",
      role: profile.role ?? "VIEWER",
      facultyName: profile.facultyName,
    };
    return next();
  }

  return res.status(500).json({ error: "Invalid AUTH_MODE" });
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  if (AUTH_MODE === "DEV") {
    req.user = DEV_USER;
  } else if (AUTH_MODE === "SSO") {
    const profile = req.session?.userProfile;
    if (profile) {
      req.user = {
        id: profile.id,
        email: profile.email ?? "",
        firstName: profile.firstName ?? "",
        lastName: profile.lastName ?? "",
        role: profile.role ?? "VIEWER",
        facultyName: profile.facultyName,
      };
    }
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Insufficient permissions" });
    next();
  };
}
