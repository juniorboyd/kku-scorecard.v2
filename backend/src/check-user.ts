import prisma from "./lib/prisma.ts";
import { decrypt } from "./utils/crypto.ts";
import { generateSync } from "otplib";

async function main() {
  const email = "watchara.sup@kkumail.com";
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log("User not found");
    return;
  }
  console.log("User details:");
  console.log("- Email:", user.email);
  console.log("- 2FA Enabled:", user.twoFactorEnabled);
  console.log("- Has Secret:", !!user.twoFactorSecret);

  if (user.twoFactorSecret) {
    try {
      const secret = decrypt(user.twoFactorSecret);
      console.log("- Decrypted Secret:", secret);

      const now = Math.floor(Date.now() / 1000);
      console.log("\nCodes relative to Server Time:");
      console.log("- 2 min ago (T-120s) :", generateSync({ secret, epoch: now - 120 }));
      console.log("- 1.5m ago (T-90s)   :", generateSync({ secret, epoch: now - 90 }));
      console.log("- 1 min ago (T-60s)  :", generateSync({ secret, epoch: now - 60 }));
      console.log("- 30s ago (T-30s)    :", generateSync({ secret, epoch: now - 30 }));
      console.log("- Current Time (now) :", generateSync({ secret, epoch: now }));
      console.log("- 30s later (T+30s)  :", generateSync({ secret, epoch: now + 30 }));
      console.log("- 1 min later (T+60s):", generateSync({ secret, epoch: now + 60 }));
      console.log("- 1.5m later (T+90s) :", generateSync({ secret, epoch: now + 90 }));
      console.log("- 2 min later (T+120s):", generateSync({ secret, epoch: now + 120 }));
    } catch (e: any) {
      console.error("Failed to decrypt secret:", e.message);
    }
  }
}

main().catch(console.error);
