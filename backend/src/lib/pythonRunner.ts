import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { PYTHON_EXECUTABLE } from "../config.ts";

export interface PythonResult {
  organization: any[];
  raw_result: any[];
  severity_count: Record<string, number>;
  factory_score: any[];
  url_not_in_domain_unique: any[];
  unused_master: any[];
  risk_by_host: any[];
  asset_summary?: Record<string, number>;
  asset_inventory?: any[];
}

export async function runPythonProcessor(scoreFile: string, masterFile: string): Promise<PythonResult> {
  // Try Docker path (/app/python) first, then local dev path (../python)
  const candidates = [
    path.resolve(process.cwd(), "python", "codeProcessData.py"),
    path.resolve(process.cwd(), "..", "python", "codeProcessData.py"),
  ];
  const scriptPath = candidates.find((p) => fs.existsSync(p)) ?? candidates[0];
  const scriptDir = path.dirname(scriptPath);

  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Python script not found: ${scriptPath}`);
  }

  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_EXECUTABLE, [scriptPath, scoreFile, masterFile], {
      cwd: scriptDir,
      shell: false,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (d) => { stdout += d.toString(); });
    child.stderr.on("data", (d) => { stderr += d.toString(); });
    child.on("error", reject);

    child.on("close", (code) => {
      if (stderr) console.error("[python stderr]", stderr.slice(0, 500));
      if (code !== 0) {
        return reject(new Error(`Python exited ${code}: ${stderr.slice(0, 2000)}`));
      }
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error(`Python returned invalid JSON (${stdout.length} bytes)`));
      }
    });
  });
}
