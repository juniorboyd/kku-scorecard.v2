import axios from "axios";
import prisma from "../lib/prisma.ts";
import { encrypt, decrypt } from "../lib/crypto.ts";
import { SSC_API_KEY, SSC_API_URL, SSC_API_KEY_HEADER, SSC_COMPANY_DOMAIN } from "../config.ts";

// Setting key under which the (encrypted) SecurityScorecard API key is stored.
export const SCORECARD_API_KEY = "SCORECARD_API_KEY";

function sscBaseUrl() {
  if (!SSC_API_URL) return "https://api.securityscorecard.io";
  try {
    return new URL(SSC_API_URL).origin;
  } catch {
    return "https://api.securityscorecard.io";
  }
}

export type KeyValidationResult = { ok: true } | { ok: false; reason: "invalid" | "unreachable" };

/**
 * Probe the SecurityScorecard API with a candidate key to confirm it works
 * before we persist it. 200 = valid, 401/403 = bad key, anything else (other
 * status, network error, timeout) = could not verify.
 */
export async function validateScorecardApiKey(apiKey: string): Promise<KeyValidationResult> {
  const url = `${sscBaseUrl()}/all-companies/${SSC_COMPANY_DOMAIN}`;
  try {
    const r = await axios.get(url, {
      headers: { accept: "application/json; charset=utf-8", [SSC_API_KEY_HEADER]: `Token ${apiKey}` },
      timeout: 30000,
      validateStatus: () => true, // inspect the status ourselves
    });
    if (r.status === 200) return { ok: true };
    if (r.status === 401 || r.status === 403) return { ok: false, reason: "invalid" };
    return { ok: false, reason: "unreachable" };
  } catch {
    return { ok: false, reason: "unreachable" };
  }
}

/**
 * Effective SecurityScorecard API key. Prefers the value saved in the Setting
 * table (stored encrypted), falling back to the SECURITY_SCORECARD_API_KEY env
 * var when nothing is in the DB. Returns "" when neither is configured.
 */
export async function getScorecardApiKey(): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key: SCORECARD_API_KEY } });
  if (row?.value) {
    try {
      return decrypt(row.value);
    } catch {
      // Corrupt/undecryptable value — fall back to env rather than break fetches.
    }
  }
  return SSC_API_KEY;
}

/** Encrypt and upsert the SecurityScorecard API key into the Setting table. */
export async function setScorecardApiKey(apiKey: string, updatedBy?: number) {
  const value = encrypt(apiKey);
  return prisma.setting.upsert({
    where: { key: SCORECARD_API_KEY },
    update: { value, updatedBy: updatedBy ?? null },
    create: { key: SCORECARD_API_KEY, value, updatedBy: updatedBy ?? null },
  });
}

/** Mask a secret for display — reveals only the last 4 characters. */
export function maskKey(key: string): string {
  if (!key) return "";
  const last4 = key.slice(-4);
  return `••••••••${last4}`;
}
