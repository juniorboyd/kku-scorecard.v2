import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env") });

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const PORT = Number(process.env.PORT ?? 4000);
export const NODE_ENV = process.env.NODE_ENV ?? "development";
export const DATABASE_URL = requireEnv("DATABASE_URL");

// Auth
export const AUTH_MODE = (process.env.AUTH_MODE ?? "DEV").toUpperCase();

// DEV-mode impersonation role for local testing (ADMIN | ANALYST | VIEWER).
const DEV_ROLE_RAW = (process.env.DEV_ROLE ?? "ADMIN").toUpperCase();
export const DEV_ROLE: "ADMIN" | "ANALYST" | "VIEWER" =
  DEV_ROLE_RAW === "ANALYST" || DEV_ROLE_RAW === "VIEWER" ? DEV_ROLE_RAW : "ADMIN";
export const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-in-production";
export const APP_BASE_URL = process.env.APP_BASE_URL ?? `http://localhost:${PORT}`;
export const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";

// Admin
export const ADMIN_EMAILS: string[] = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// SSO
export const SSO_APP_ID = process.env.SSO_APP_ID ?? "";
export const SSO_CLIENT_ID = process.env.SSO_CLIENT_ID ?? "";
export const SSO_CLIENT_SECRET = process.env.SSO_CLIENT_SECRET ?? "";
export const SSO_LOGIN_URL = process.env.SSO_LOGIN_URL ?? "https://sso-uat-web.kku.ac.th/login";
export const SSO_LOGOUT_URL = process.env.SSO_LOGOUT_URL ?? "https://sso-uat-web.kku.ac.th/logout";
export const SSO_TOKEN_API = process.env.SSO_TOKEN_API ?? "https://sso-uat-api.kku.ac.th/auth.token";
export const SSO_PROFILE_API = process.env.SSO_PROFILE_API ?? "https://sso-uat-api.kku.ac.th/user.profile";
export const SSO_STATUS_API = process.env.SSO_STATUS_API ?? "https://sso-uat-api.kku.ac.th/auth.status";
export const SSO_REDIRECT_URL = process.env.SSO_REDIRECT_URL ?? `${APP_BASE_URL}/callback`;

// SecurityScorecard
export const SSC_API_URL = process.env.SECURITY_SCORECARD_API_URL ?? "";
export const SSC_API_KEY = process.env.SECURITY_SCORECARD_API_KEY ?? "";
export const SSC_API_KEY_HEADER = process.env.SECURITY_SCORECARD_API_KEY_HEADER ?? "Authorization";
export const SSC_COMPANY_DOMAIN = process.env.SECURITY_SCORECARD_COMPANY_DOMAIN ?? "kku.ac.th";
export const SSC_SCORE_HISTORY_URL = process.env.SECURITY_SCORECARD_SCORE_HISTORY_URL ?? "";

// Encryption — used to encrypt sensitive Setting values (e.g. the SSC API key)
// at rest. Must be a 32-byte key supplied as 64 hex chars. The app refuses to
// start without it. Generate one with:
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
export const ENCRYPTION_KEY: Buffer = (() => {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      'Missing required environment variable: ENCRYPTION_KEY. Generate one with: ' +
        'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  const key = Buffer.from(raw, "hex");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be a 32-byte value encoded as 64 hex characters");
  }
  return key;
})();

// Paths
export const PYTHON_EXECUTABLE = process.env.PYTHON_EXECUTABLE ?? "/usr/bin/python3";
export const ROOT_DIR = process.cwd();
export const DATA_DIR = resolve(ROOT_DIR, "data");
export const UPLOAD_DIR = resolve(ROOT_DIR, "data", "uploads");
export const TEMP_DIR = resolve(ROOT_DIR, "data", "tmp");

if (NODE_ENV === "production" && AUTH_MODE === "DEV") {
  throw new Error("DEV auth mode is not allowed in production");
}

// LibreNMS API Configuration
export const LIBRENMS_API_URL = process.env.LIBRENMS_API_URL ?? "https://lnms.kku.ac.th/api/v0";
export const LIBRENMS_API_TOKEN = process.env.LIBRENMS_API_TOKEN ?? "";

