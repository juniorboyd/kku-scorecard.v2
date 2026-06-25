import axios from "axios";
import { LIBRENMS_API_URL, LIBRENMS_API_TOKEN } from "../config.ts";

export interface NetworkNode {
  id: string;
  label: string;
  type: "core" | "distribution" | "access" | "server";
  ip?: string;
  status: "up" | "down";
  organization?: string;
}

export interface NetworkLink {
  source: string;
  target: string;
  status: "up" | "down";
}

export interface NetworkTopology {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

// Mock data fallback matching KKU structure
const MOCK_TOPOLOGY: NetworkTopology = (() => {
  const nodes: NetworkNode[] = [
    { id: "core-0", label: "KKU-Core-Router-01 (Mittraphap)", type: "core", ip: "10.254.0.1", status: "up" },
    { id: "core-1", label: "KKU-Core-Router-02 (ODT)", type: "core", ip: "10.254.0.2", status: "up" },
  ];

  const links: NetworkLink[] = [
    { source: "core-0", target: "core-1", status: "up" }
  ];

  const faculties = [
    { code: "MED", th: "คณะแพทยศาสตร์", colorClass: "bg-red-500" },
    { code: "ENG", th: "คณะวิศวกรรมศาสตร์", colorClass: "bg-orange-500" },
    { code: "SCI", th: "คณะวิทยาศาสตร์", colorClass: "bg-yellow-500" },
    { code: "ED", th: "คณะศึกษาศาสตร์", colorClass: "bg-orange-500" },
    { code: "GS", th: "บัณฑิตวิทยาลัย", colorClass: "bg-teal-500" },
    { code: "HUSO", th: "คณะมนุษยศาสตร์และสังคมศาสตร์", colorClass: "bg-purple-500" },
    { code: "KKBS", th: "คณะบริหารธุรกิจและการบัญชี", colorClass: "bg-blue-500" },
    { code: "AMS", th: "คณะเทคนิคการแพทย์", colorClass: "bg-pink-500" },
    { code: "ECON", th: "คณะเศรษฐศาสตร์", colorClass: "bg-lime-500" },
    { code: "ARCH", th: "คณะสถาปัตยกรรมศาสตร์", colorClass: "bg-emerald-500" },
    { code: "DENT", th: "คณะทันตแพทยศาสตร์", colorClass: "bg-cyan-500" },
    { code: "CP", th: "วิทยาลัยการคอมพิวเตอร์", colorClass: "bg-indigo-500" },
    { code: "IS", th: "คณะสหวิทยาการ มข. (หนองคาย)", colorClass: "bg-blue-500" },
    { code: "PH", th: "คณะสาธารณสุขศาสตร์", colorClass: "bg-teal-500" },
    { code: "FA", th: "คณะศิลปกรรมศาสตร์", colorClass: "bg-pink-500" },
    { code: "PS", th: "คณะเภสัชศาสตร์", colorClass: "bg-red-500" },
    { code: "AG", th: "คณะเกษตรศาสตร์", colorClass: "bg-green-500" },
    { code: "LW", th: "คณะนิติศาสตร์", colorClass: "bg-indigo-500" },
    { code: "TE", th: "คณะเทคโนโลยี", colorClass: "bg-amber-500" },
    { code: "NU", th: "คณะพยาบาลศาสตร์", colorClass: "bg-cyan-500" },
    { code: "VM", th: "คณะสัตวแพทยศาสตร์", colorClass: "bg-green-500" }
  ];

  faculties.forEach((f, i) => {
    const distId = `dist-${f.code.toLowerCase()}`;
    const accId1 = `acc-${f.code.toLowerCase()}-01`;
    const accId2 = `acc-${f.code.toLowerCase()}-02`;

    // Distribution switch
    nodes.push({
      id: distId,
      label: `sw-dist-${f.code.toLowerCase()}-01.kku.ac.th`,
      type: "distribution",
      ip: `10.${100 + i}.0.1`,
      status: "up",
      organization: f.th
    });

    // Access switch 1
    nodes.push({
      id: accId1,
      label: `sw-acc-${f.code.toLowerCase()}-01`,
      type: "access",
      ip: `10.${100 + i}.1.11`,
      status: "up",
      organization: f.th
    });

    // Access switch 2 (Medicine & Engineering have some mock down status switches for realism)
    const status2 = (f.code === "MED" && i % 2 === 0) || (f.code === "ENG") ? "down" : "up";
    nodes.push({
      id: accId2,
      label: `sw-acc-${f.code.toLowerCase()}-02`,
      type: "access",
      ip: `10.${100 + i}.1.12`,
      status: status2,
      organization: f.th
    });

    // Link Core to Distribution
    links.push({
      source: i % 2 === 0 ? "core-0" : "core-1",
      target: distId,
      status: "up"
    });

    // Links Distribution to Access
    links.push({ source: distId, target: accId1, status: "up" });
    links.push({ source: distId, target: accId2, status: status2 });
  });

  return { nodes, links };
})();

// Normalize hostname or sysName to match KKU organizations precisely using token-based matching
function matchOrgFromHostname(hostname: string, sysName?: string): string | undefined {
  const nameStr = (hostname + " " + (sysName || "")).toLowerCase();
  // Split by non-alphanumeric to get clean tokens
  const tokens = nameStr.split(/[^a-z0-9]/);

  // Helper checks
  const hasToken = (t: string) => tokens.includes(t);
  const hasPrefix = (prefix: string) => tokens.some(t => t.startsWith(prefix));

  // Specific order and rules to avoid substring false positives (e.g. 'fa' in 'faculty', 'te' in 'inter', 'ar' in 'vxtarget')
  
  // Medicine
  if (hasToken("med") || hasToken("md") || hasToken("medicine") || hasToken("smd") || hasPrefix("smd")) return "คณะแพทยศาสตร์";
  
  // Veterinary Medicine
  if (hasToken("vet") || hasToken("vm") || hasPrefix("vet")) return "คณะสัตวแพทยศาสตร์";

  // Engineering
  if (hasToken("eng") || hasToken("enit") || hasPrefix("eng")) return "คณะวิศวกรรมศาสตร์";
  
  // Science / Science Park
  if (hasToken("sci") || hasToken("sc") || hasPrefix("sci") || hasToken("scipark")) return "คณะวิทยาศาสตร์";
  
  // Education
  if (hasToken("edu") || hasToken("ed") || hasPrefix("edu")) return "คณะศึกษาศาสตร์";
  
  // Graduate School
  if (hasToken("gs") || hasToken("grad")) return "บัณฑิตวิทยาลัย";
  
  // Humanities and Social Sciences
  if (hasToken("huso")) return "คณะมนุษยศาสตร์และสังคมศาสตร์";
  
  // Business School
  if (hasToken("kkbs") || hasToken("bus") || hasToken("business")) return "คณะบริหารธุรกิจและการบัญชี";
  
  // Associated Medical Sciences
  if (hasToken("ams")) return "คณะเทคนิคการแพทย์";
  
  // Economics
  if (hasToken("econ") || hasToken("economy")) return "คณะเศรษฐศาสตร์";
  
  // Architecture
  if (hasToken("arch") || hasToken("ar") || hasToken("architecture")) return "คณะสถาปัตยกรรมศาสตร์";
  
  // Dentistry
  if (hasToken("dent") || hasPrefix("dent")) return "คณะทันตแพทยศาสตร์";
  
  // Computing
  if (hasToken("computing") || hasToken("cp")) return "วิทยาลัยการคอมพิวเตอร์";
  
  // Nongkhai (Interdisciplinary)
  if (hasToken("is") || hasToken("nongkhai") || hasToken("nk")) return "คณะสหวิทยาการ มข. (หนองคาย)";
  
  // Public Health
  if (hasToken("ph") || hasToken("publichealth")) return "คณะสาธารณสุขศาสตร์";
  
  // Fine Arts
  if (hasToken("fa") || hasToken("finearts")) return "คณะศิลปกรรมศาสตร์";
  
  // Pharmacy
  if (hasToken("pharm") || hasToken("ps") || hasPrefix("pharm")) return "คณะเภสัชศาสตร์";
  
  // Agriculture
  if (hasToken("ag") || hasToken("agri") || hasPrefix("agri") || hasToken("agriculture")) return "คณะเกษตรศาสตร์";
  
  // Law
  if (hasToken("law") || hasToken("lw")) return "คณะนิติศาสตร์";
  
  // Technology
  if (hasToken("te") || hasToken("tech") || hasPrefix("tech") || hasToken("technology")) return "คณะเทคโนโลยี";
  
  // Nursing
  if (hasToken("nu") || hasToken("nurs") || hasPrefix("nurs") || hasToken("nursing")) return "คณะพยาบาลศาสตร์";

  return undefined;
}

export async function getNetworkTopology(): Promise<NetworkTopology> {
  if (!LIBRENMS_API_TOKEN) {
    console.log("[LibreNMS] No API token configured. Returning mock topology.");
    return MOCK_TOPOLOGY;
  }

  try {
    const response = await axios.get(`${LIBRENMS_API_URL}/devices`, {
      headers: {
        "X-Auth-Token": LIBRENMS_API_TOKEN,
      },
      timeout: 10000,
    });

    const apiDevices = response.data?.devices;
    if (!Array.isArray(apiDevices)) {
      throw new Error("Invalid response format from LibreNMS devices API");
    }

    const nodes: NetworkNode[] = [
      { id: "core-0", label: "KKU-Core-Router-01 (Mittraphap)", type: "core", ip: "10.254.0.1", status: "up" },
    ];
    const links: NetworkLink[] = [];

    // Track created distribution nodes to link access nodes to them
    const distNodes = new Map<string, string>(); // org -> node_id

    apiDevices.forEach((d: any, index: number) => {
      const hostname = d.hostname ?? `device-${d.device_id}`;
      const org = matchOrgFromHostname(hostname, d.sysName);
      const status = d.status === 1 || d.status === "1" || d.status === true ? "up" : "down";
      const ip = d.ip ?? undefined;

      if (org) {
        let distId = distNodes.get(org);
        if (!distId) {
          distId = `dist-${index}`;
          distNodes.set(org, distId);
          // Create distribution node for this org
          nodes.push({
            id: distId,
            label: `sw-dist-${org.substring(4, 8)}-01.kku.ac.th`,
            type: "distribution",
            status: "up",
            organization: org
          });
          // Connect to core
          links.push({ source: "core-0", target: distId, status: "up" });
        }

        const accessId = `acc-${d.device_id}`;
        nodes.push({
          id: accessId,
          label: hostname,
          type: "access",
          ip,
          status,
          organization: org
        });

        // Connect access node to distribution node
        links.push({ source: distId, target: accessId, status });
      } else {
        // Unassigned node directly connected to core
        const genericId = `gen-${d.device_id}`;
        nodes.push({
          id: genericId,
          label: hostname,
          type: "access",
          ip,
          status,
        });
        links.push({ source: "core-0", target: genericId, status });
      }
    });

    return { nodes, links };
  } catch (error: any) {
    console.error("[LibreNMS] Failed to fetch device topology, using mock fallback. Error:", error.message);
    return MOCK_TOPOLOGY;
  }
}
