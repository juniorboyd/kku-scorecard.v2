import fs from "fs";
import xlsx from "xlsx";
import { normalizeOrganizationName } from "./textUtils.ts";

export function ensureDirectory(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function sanitizeString(value: string): string {
  if (!value || typeof value !== "string") return "";
  let s = value.normalize("NFC");
  s = s
    .replace(/�/g, "")
    .replace(/[￹-￻]/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/﻿/g, "");
  return s.replace(/\s+/g, " ").trim();
}

export function parseSpreadsheet(filePath: string): Record<string, unknown>[] {
  const workbook = xlsx.readFile(filePath, { cellDates: true, raw: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("No sheets found in spreadsheet");
  const sheet = workbook.Sheets[sheetName];
  const records = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  return records.map((row) => {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      sanitized[key] = typeof value === "string" ? sanitizeString(value) : value;
    }
    return sanitized;
  });
}

export function normalizeMappingRow(row: Record<string, unknown>) {
  const normalize = (value: unknown) => (value == null ? "" : String(value).trim());
  const findKey = (pattern: RegExp) => Object.keys(row).find((k) => pattern.test(k));

  const orgName = normalizeOrganizationName(normalize(
    row["Organization"] ??
    row["organization"] ??
    row["เว็บไซต์ของส่วนงาน(คณะ/วิทยาลัย/สำนัก)"] ??
    (findKey(/org|unit|หน่วยงาน|คณะ/i) ? row[findKey(/org|unit|หน่วยงาน|คณะ/i)!] : undefined)
  ));

  const domain = normalize(
    row["URLWebsite"] ??
    row["url"] ??
    row["domain"] ??
    row["URL ของเว็บไซต์"] ??
    (findKey(/url|domain|เว็บ|โดเมน/i) ? row[findKey(/url|domain|เว็บ|โดเมน/i)!] : undefined)
  ).toLowerCase();

  return { orgName, domain };
}

export function saveCsvFile(rows: Record<string, string>[], filePath: string) {
  const headers = Object.keys(rows[0] ?? {});
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")),
  ];
  fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
}
