export function normalizeThai(text: string): string {
  return String(text ?? "").trim().replace(/\s+/g, "").toLowerCase();
}

export function normalizeOrganizationName(name: string): string {
  if (!name || typeof name !== "string") return "";
  return name.normalize("NFC").replace(/\s+/g, " ").trim();
}

export function hasCorruptedUnicode(text: string): boolean {
  if (!text) return false;
  // Catches standard mojibake like à¸, Ã, or replacement characters
  return /[￹-￻]|[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]|à¸|à¹|Ã/.test(text);
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

export function matchOrgFromHostname(hostname: string): string | undefined {
  const nameStr = (hostname || "").toLowerCase();
  const tokens = nameStr.split(/[^a-z0-9]/);
  const hasToken = (t: string) => tokens.includes(t);
  const hasPrefix = (prefix: string) => tokens.some(t => t.startsWith(prefix));

  if (hasToken("med") || hasToken("md") || hasToken("medicine") || hasToken("smd") || hasPrefix("smd")) return "คณะแพทยศาสตร์";
  if (hasToken("vet") || hasToken("vm") || hasPrefix("vet")) return "คณะสัตวแพทยศาสตร์";
  if (hasToken("eng") || hasToken("enit") || hasPrefix("eng")) return "คณะวิศวกรรมศาสตร์";
  if (hasToken("sci") || hasToken("sc") || hasPrefix("sci") || hasToken("scipark")) return "คณะวิทยาศาสตร์";
  if (hasToken("edu") || hasToken("ed") || hasPrefix("edu")) return "คณะศึกษาศาสตร์";
  if (hasToken("gs") || hasToken("grad")) return "บัณฑิตวิทยาลัย";
  if (hasToken("huso")) return "คณะมนุษยศาสตร์และสังคมศาสตร์";
  if (hasToken("kkbs") || hasToken("bus") || hasToken("business")) return "คณะบริหารธุรกิจและการบัญชี";
  if (hasToken("ams")) return "คณะเทคนิคการแพทย์";
  if (hasToken("econ") || hasToken("economy")) return "คณะเศรษฐศาสตร์";
  if (hasToken("arch") || hasToken("ar") || hasToken("architecture")) return "คณะสถาปัตยกรรมศาสตร์";
  if (hasToken("dent") || hasPrefix("dent")) return "คณะทันตแพทยศาสตร์";
  if (hasToken("computing") || hasToken("cp")) return "วิทยาลัยการคอมพิวเตอร์";
  if (hasToken("is") || hasToken("nongkhai") || hasToken("nk")) return "คณะสหวิทยาการ มข. (หนองคาย)";
  if (hasToken("ph") || hasToken("publichealth")) return "คณะสาธารณสุขศาสตร์";
  if (hasToken("fa") || hasToken("finearts")) return "คณะศิลปกรรมศาสตร์";
  if (hasToken("pharm") || hasToken("ps") || hasPrefix("pharm")) return "คณะเภสัชศาสตร์";
  if (hasToken("ag") || hasToken("agri") || hasPrefix("agri") || hasToken("agriculture")) return "คณะเกษตรศาสตร์";
  if (hasToken("law") || hasToken("lw")) return "คณะนิติศาสตร์";
  if (hasToken("te") || hasToken("tech") || hasPrefix("tech") || hasToken("technology")) return "คณะเทคโนโลยี";
  if (hasToken("nu") || hasToken("nurs") || hasPrefix("nurs") || hasToken("nursing")) return "คณะพยาบาลศาสตร์";
  return undefined;
}
