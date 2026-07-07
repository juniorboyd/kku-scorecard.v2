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
