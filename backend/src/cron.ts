import cron from "node-cron";
import { fetchSecurityScorecardFromApi } from "./services/importService.ts";
import { writeAuditLog } from "./services/logService.ts";

export function scheduleDailyFetch() {
  cron.schedule(
    "0 0 * * *",
    async () => {
      console.log("[cron] Starting daily SecurityScorecard fetch");
      try {
        await fetchSecurityScorecardFromApi("cronAutoFetch");
        await writeAuditLog(null, "CRON_FETCH_SUCCESS");
        console.log("[cron] Daily fetch completed successfully");
      } catch (err) {
        await writeAuditLog(null, `CRON_FETCH_FAILED: ${(err as Error).message}`, "FAILED");
        console.error("[cron] Daily fetch failed:", err);
      }
    },
    { timezone: "Asia/Bangkok" }
  );
  console.log("[cron] Scheduled daily fetch at 00:00 Asia/Bangkok");
}
