import tls from "tls";
import dns from "dns/promises";
import https from "https";
import http from "http";
import net from "net";

export interface ScanFinding {
  factorName: string;
  issueTypeTitle: string;
  severity: "HIGH" | "MEDIUM" | "LOW" | "INFO";
  scoreImpact: number;
  description: string;
}

export interface CookieAudit {
  name: string;
  hasSecure: boolean;
  hasHttpOnly: boolean;
  hasSameSite: boolean;
}

export interface PortCheckResult {
  port: number;
  service: string;
  isOpen: boolean;
}

export interface DomainScanResult {
  target: string;
  scannedAt: string;
  isOnline: boolean;
  httpStatus?: number;
  responseTimeMs?: number;
  techDetection?: {
    cms?: string;
    serverBanner?: string;
    poweredBy?: string;
    exposedMetaGenerator?: string;
  };
  cookieAudits?: CookieAudit[];
  portChecks?: PortCheckResult[];
  sslInfo?: {
    valid: boolean;
    validTo?: string;
    daysRemaining?: number;
    issuer?: string;
  };
  headersFound: Record<string, string>;
  missingSecurityHeaders: string[];
  dnsInfo?: {
    hasSpf: boolean;
    hasDmarc: boolean;
    ipAddresses: string[];
  };
  findings: ScanFinding[];
  healthScore: number;
}

async function checkPort(host: string, port: number, timeout = 2500): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.on("connect", () => { socket.destroy(); resolve(true); });
    socket.on("timeout", () => { socket.destroy(); resolve(false); });
    socket.on("error", () => { socket.destroy(); resolve(false); });
    socket.connect(port, host);
  });
}

export async function scanSingleTarget(targetHost: string): Promise<DomainScanResult> {
  const cleanHost = targetHost.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").trim();
  const scannedAt = new Date().toISOString();
  const findings: ScanFinding[] = [];
  let healthScore = 100;

  let isOnline = false;
  let httpStatus: number | undefined;
  let responseTimeMs: number | undefined;
  const headersFound: Record<string, string> = {};
  const missingHeaders: string[] = [];
  const cookieAudits: CookieAudit[] = [];

  let techDetection: DomainScanResult["techDetection"] = {};

  // 1. HTTP / HTTPS Inspection, Headers, Cookies, Tech Stack
  const startTime = Date.now();
  try {
    const url = cleanHost.startsWith("http") ? cleanHost : `https://${cleanHost}`;
    const res = await new Promise<{ statusCode?: number; headers: http.IncomingHttpHeaders; body: string }>((resolve, reject) => {
      const req = https.get(url, { timeout: 8000, rejectUnauthorized: false }, (response) => {
        let chunks = "";
        response.on("data", (chunk) => { if (chunks.length < 50000) chunks += chunk.toString(); });
        response.on("end", () => resolve({ statusCode: response.statusCode, headers: response.headers, body: chunks }));
      });
      req.on("error", (err) => reject(err));
      req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
    });

    isOnline = true;
    httpStatus = res.statusCode;
    responseTimeMs = Date.now() - startTime;

    const lowerHeaders = Object.keys(res.headers).reduce((acc, k) => {
      acc[k.toLowerCase()] = String(res.headers[k]);
      return acc;
    }, {} as Record<string, string>);

    // Security Headers Check
    const requiredHeaders = [
      { name: "content-security-policy", title: "Content Security Policy (CSP) Missing", severity: "LOW", impact: 1.5 },
      { name: "strict-transport-security", title: "HTTP Strict Transport Security (HSTS) Missing", severity: "LOW", impact: 1.2 },
      { name: "x-frame-options", title: "X-Frame-Options Header Missing", severity: "LOW", impact: 1.0 },
      { name: "x-content-type-options", title: "X-Content-Type-Options Header Missing", severity: "LOW", impact: 1.0 },
    ];

    for (const h of requiredHeaders) {
      if (lowerHeaders[h.name]) {
        headersFound[h.name] = lowerHeaders[h.name];
      } else {
        missingHeaders.push(h.name);
        findings.push({
          factorName: "Application Security",
          issueTypeTitle: h.title,
          severity: h.severity as any,
          scoreImpact: h.impact,
          description: `The web server at ${cleanHost} does not send the ${h.name} header.`
        });
        healthScore -= h.impact * 4;
      }
    }

    // 2. Server Banner & Tech Stack Audit
    if (lowerHeaders["server"]) {
      techDetection.serverBanner = lowerHeaders["server"];
      if (/\d+\.\d+/.test(lowerHeaders["server"])) {
        findings.push({
          factorName: "Application Security",
          issueTypeTitle: "Server Banner Discloses Detailed Version",
          severity: "LOW",
          scoreImpact: 1.0,
          description: `Server header exposes detailed version info: ${lowerHeaders["server"]}`
        });
        healthScore -= 3;
      }
    }
    if (lowerHeaders["x-powered-by"]) {
      techDetection.poweredBy = lowerHeaders["x-powered-by"];
      findings.push({
        factorName: "Application Security",
        issueTypeTitle: "X-Powered-By Header Discloses Technology",
        severity: "LOW",
        scoreImpact: 1.0,
        description: `Exposes tech stack: ${lowerHeaders["x-powered-by"]}`
      });
      healthScore -= 3;
    }

    // CMS & Meta Generator Detection from Body
    const metaGenMatch = res.body.match(/<meta\s+name=["']generator["']\s+content=["']([^"']+)["']/i);
    if (metaGenMatch) {
      techDetection.exposedMetaGenerator = metaGenMatch[1];
      findings.push({
        factorName: "Application Security",
        issueTypeTitle: "Exposed Generator Meta Tag",
        severity: "LOW",
        scoreImpact: 1.0,
        description: `Web page exposes generator software version: ${metaGenMatch[1]}`
      });
      healthScore -= 2;
    }

    if (/wp-content|wp-includes/i.test(res.body)) techDetection.cms = "WordPress";
    else if (/joomla/i.test(res.body)) techDetection.cms = "Joomla";
    else if (/drupal/i.test(res.body)) techDetection.cms = "Drupal";

    // 3. Cookie Security Audit
    const setCookieHeader = res.headers["set-cookie"];
    if (setCookieHeader) {
      const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
      for (const cookieStr of cookies) {
        const parts = cookieStr.split(";").map((p) => p.trim());
        const name = parts[0]?.split("=")[0] || "cookie";
        const hasSecure = parts.some((p) => /^secure$/i.test(p));
        const hasHttpOnly = parts.some((p) => /^httponly$/i.test(p));
        const hasSameSite = parts.some((p) => /^samesite=/i.test(p));

        cookieAudits.push({ name, hasSecure, hasHttpOnly, hasSameSite });

        if (!hasSecure || !hasHttpOnly) {
          findings.push({
            factorName: "Application Security",
            issueTypeTitle: "Cookie Insecure Security Flags",
            severity: "LOW",
            scoreImpact: 1.0,
            description: `Cookie '${name}' missing ${!hasSecure ? "Secure " : ""}${!hasHttpOnly ? "HttpOnly" : ""} flag.`
          });
          healthScore -= 3;
        }
      }
    }
  } catch (err) {
    try {
      const res = await new Promise<{ statusCode?: number; headers: http.IncomingHttpHeaders }>((resolve, reject) => {
        const req = http.get(`http://${cleanHost}`, { timeout: 8000 }, (response) => {
          resolve({ statusCode: response.statusCode, headers: response.headers });
        });
        req.on("error", (err) => reject(err));
        req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
      });
      isOnline = true;
      httpStatus = res.statusCode;
      responseTimeMs = Date.now() - startTime;

      findings.push({
        factorName: "Application Security",
        issueTypeTitle: "Insecure HTTP Protocol Enabled without Redirect",
        severity: "MEDIUM",
        scoreImpact: 3.0,
        description: `Target ${cleanHost} responds over unencrypted HTTP.`
      });
      healthScore -= 15;
    } catch {
      isOnline = false;
      findings.push({
        factorName: "Network Security",
        issueTypeTitle: "Target Unreachable / Connection Refused",
        severity: "INFO",
        scoreImpact: 0,
        description: `Could not establish connection to ${cleanHost} on port 80 or 443.`
      });
    }
  }

  // 4. SSL/TLS Certificate Expiry Check
  let sslInfo: DomainScanResult["sslInfo"];
  if (isOnline) {
    try {
      const cert = await new Promise<tls.PeerCertificate>((resolve, reject) => {
        const socket = tls.connect(443, cleanHost, { servername: cleanHost, rejectUnauthorized: false, timeout: 5000 }, () => {
          const peerCert = socket.getPeerCertificate();
          socket.end();
          resolve(peerCert);
        });
        socket.on("error", reject);
        socket.on("timeout", () => { socket.destroy(); reject(new Error("SSL Timeout")); });
      });

      if (cert && cert.valid_to) {
        const validTo = new Date(cert.valid_to);
        const daysRemaining = Math.floor((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const isValid = daysRemaining > 0;
        const issuerOrg = Array.isArray(cert.issuer?.O) ? cert.issuer.O.join(" ") : cert.issuer?.O;
        const issuerCn = Array.isArray(cert.issuer?.CN) ? cert.issuer.CN.join(" ") : cert.issuer?.CN;
        sslInfo = {
          valid: isValid,
          validTo: validTo.toISOString(),
          daysRemaining,
          issuer: issuerOrg || issuerCn || "Unknown Issuer",
        };

        if (daysRemaining <= 0) {
          findings.push({
            factorName: "Application Security",
            issueTypeTitle: "Expired SSL/TLS Certificate",
            severity: "HIGH",
            scoreImpact: 10.0,
            description: `The SSL certificate for ${cleanHost} expired ${Math.abs(daysRemaining)} days ago.`
          });
          healthScore -= 30;
        } else if (daysRemaining < 15) {
          findings.push({
            factorName: "Application Security",
            issueTypeTitle: "SSL/TLS Certificate Expiring Soon",
            severity: "MEDIUM",
            scoreImpact: 4.0,
            description: `The SSL certificate for ${cleanHost} will expire in ${daysRemaining} days.`
          });
          healthScore -= 10;
        }
      }
    } catch {
      // SSL check failed
    }
  }

  // 5. DNS Security Checks (SPF & DMARC)
  let dnsInfo: DomainScanResult["dnsInfo"] = { hasSpf: false, hasDmarc: false, ipAddresses: [] };
  try {
    const aRecords = await dns.resolve4(cleanHost).catch(() => []);
    dnsInfo.ipAddresses = aRecords;

    const txtRecords = await dns.resolveTxt(cleanHost).catch(() => []);
    const flattenedTxt = txtRecords.flat().join(" ");
    dnsInfo.hasSpf = /v=spf1/i.test(flattenedTxt);

    const dmarcRecords = await dns.resolveTxt(`_dmarc.${cleanHost}`).catch(() => []);
    const flattenedDmarc = dmarcRecords.flat().join(" ");
    dnsInfo.hasDmarc = /v=DMARC1/i.test(flattenedDmarc);

    if (!dnsInfo.hasSpf) {
      findings.push({
        factorName: "DNS Health",
        issueTypeTitle: "SPF Record Missing or Misconfigured",
        severity: "LOW",
        scoreImpact: 1.5,
        description: `Domain ${cleanHost} does not publish an SPF TXT record.`
      });
      healthScore -= 5;
    }
    if (!dnsInfo.hasDmarc) {
      findings.push({
        factorName: "DNS Health",
        issueTypeTitle: "DMARC Record Missing",
        severity: "LOW",
        scoreImpact: 1.5,
        description: `Domain ${cleanHost} does not publish a DMARC TXT record.`
      });
      healthScore -= 5;
    }
  } catch {
    // DNS lookup failure
  }

  // 6. Common Ports Security Audit
  const targetIp = dnsInfo.ipAddresses[0] || cleanHost;
  const portsToTest = [
    { port: 80, service: "HTTP" },
    { port: 443, service: "HTTPS" },
    { port: 21, service: "FTP" },
    { port: 22, service: "SSH" },
    { port: 3389, service: "RDP" },
  ];

  const portChecks: PortCheckResult[] = await Promise.all(
    portsToTest.map(async (p) => {
      const open = await checkPort(targetIp, p.port);
      return { port: p.port, service: p.service, isOpen: open };
    })
  );

  for (const pc of portChecks) {
    if (pc.isOpen && (pc.port === 21 || pc.port === 3389)) {
      findings.push({
        factorName: "Network Security",
        issueTypeTitle: `Exposed Insecure Port (${pc.service} - Port ${pc.port})`,
        severity: "MEDIUM",
        scoreImpact: 4.0,
        description: `Service ${pc.service} on port ${pc.port} is publicly accessible.`
      });
      healthScore -= 10;
    }
  }

  healthScore = Math.max(0, Math.min(100, Math.round(healthScore * 10) / 10));

  return {
    target: cleanHost,
    scannedAt,
    isOnline,
    httpStatus,
    responseTimeMs,
    techDetection,
    cookieAudits,
    portChecks,
    sslInfo,
    headersFound,
    missingSecurityHeaders: missingHeaders,
    dnsInfo,
    findings,
    healthScore,
  };
}
