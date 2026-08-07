import prisma from "./lib/prisma.ts";
import { decrypt } from "./utils/crypto.ts";
import { generateSync } from "otplib";

async function main() {
  const email = "watchara.sup@kkumail.com";
  const args = process.argv.slice(2);

  // 1. Check for Reset Command
  if (args.includes("reset")) {
    await prisma.user.update({
      where: { email },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
    console.log(`Successfully reset 2FA to DISABLED for ${email}`);
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log("User not found");
    return;
  }

  if (!user.twoFactorSecret) {
    console.log("2FA Secret is not set for this user yet.");
    return;
  }

  const secret = decrypt(user.twoFactorSecret);
  const now = Math.floor(Date.now() / 1000);

  // 2. Check for Scan Command (Search for phone code offset)
  // Usage: node dist/check-user.js scan 123456
  if (args[0] === "scan" && args[1]) {
    const targetCode = args[1];
    console.log(`Scanning for code ${targetCode} within a 1-hour window (30-second steps)...`);
    
    let found = false;
    // Scan from -60 minutes to +60 minutes
    for (let offset = -3600; offset <= 3600; offset += 30) {
      const code = generateSync({ secret, epoch: now + offset });
      if (code === targetCode) {
        const minutes = (offset / 60).toFixed(1);
        console.log(`\n🎉 FOUND MATCH!`);
        console.log(`- Time Offset: ${minutes} minutes (${offset} seconds)`);
        if (offset < 0) {
          console.log(`- Meaning: The server clock is SLOWER than your phone by ${Math.abs(Number(minutes))} minutes.`);
        } else {
          console.log(`- Meaning: The server clock is FASTER than your phone by ${minutes} minutes.`);
        }
        found = true;
        break;
      }
    }
    if (!found) {
      console.log("\n❌ Code not found in the 1-hour time window. Please verify if you scanned the correct QR code.");
    }
    return;
  }

  // Default: Print standard details
  console.log("User details:");
  console.log("- Email:", user.email);
  console.log("- 2FA Enabled:", user.twoFactorEnabled);
  console.log("- Has Secret:", !!user.twoFactorSecret);
  console.log("- Decrypted Secret:", secret);

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
}

main().catch(console.error);
