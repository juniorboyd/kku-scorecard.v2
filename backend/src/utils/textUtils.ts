export function normalizeThai(text: string): string {
  return String(text ?? "").trim().replace(/\s+/g, "").toLowerCase();
}

export function normalizeOrganizationName(name: string): string {
  if (!name || typeof name !== "string") return "";
  return name.normalize("NFC").replace(/\s+/g, " ").trim();
}

export function hasCorruptedUnicode(text: string): boolean {
  if (!text) return false;
  return /[�￹-￻]|[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(text);
}

function levenshteinDistance(a: string, b: string): number {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  if (s1 === s2) return 0;
  const m = s1.length, n = s2.length;
  const dp: number[][] = Array.from({ length: n + 1 }, (_, i) => [i]);
  for (let j = 0; j <= m; j++) dp[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = s2[i - 1] === s1[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i][j - 1], dp[i - 1][j]);
    }
  }
  return dp[n][m];
}

export function calculateStringSimilarity(a: string, b: string): number {
  const s1 = String(a || "").trim();
  const s2 = String(b || "").trim();
  if (s1 === s2) return 100;
  const max = Math.max(s1.length, s2.length);
  if (max === 0) return 100;
  return Math.round(((max - levenshteinDistance(s1, s2)) / max) * 100);
}
