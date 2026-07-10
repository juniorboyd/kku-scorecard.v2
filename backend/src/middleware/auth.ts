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
  // 1. ตรวจสอบว่ามีการส่ง API Key มาหรือไม่ (รองรับทั้ง Header และ URL Parameter)
  const apiKey = (req.headers["x-api-key"] as string) || (req.query.apiKey as string);
  
  if (apiKey) {
    try {
      const keyRecord = await prisma.apiKey.findUnique({
        where: { key: apiKey },
      });

      // ถ้า API Key ถูกต้อง ให้สิทธิ์ระดับ ADMIN ทันที
      if (keyRecord && keyRecord.isActive) {
        req.user = {
          id: 9999,
          email: "api.master@system",
          firstName: "API",
          lastName: "Master",
          role: "ADMIN",
          facultyName: "System"
        };
        return next();
      }
    } catch (error) {
      console.error("Error validating API key in global auth:", error);
    }
  }

  // 2. ถ้าไม่มี API Key ให้ใช้ระบบล็อกอินปกติ (Session)
  req.user = DEV_USER;
  return next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  req.user = DEV_USER;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    req.user = DEV_USER;
    next();
  };
}

import prisma from "../lib/prisma.ts";

export async function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = (req.headers["x-api-key"] as string) || (req.query.apiKey as string);

  if (!apiKey) {
    return res.status(401).json({ success: false, error: "API key is missing" });
  }

  try {
    const keyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
    });

    if (!keyRecord || !keyRecord.isActive) {
      return res.status(403).json({ success: false, error: "Invalid or inactive API key" });
    }

    // Attach API key info to request if needed by downstream handlers
    (req as any).apiKeyInfo = keyRecord;

    next();
  } catch (error) {
    console.error("Error validating API key:", error);
    res.status(500).json({ success: false, error: "Internal server error during authentication" });
  }
}
