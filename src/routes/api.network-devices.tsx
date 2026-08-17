import { createFileRoute } from "@tanstack/react-router";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const PING_TIMEOUT_MS = 900;
const MAX_PING_CONCURRENCY = 48;
const DEFAULT_NETWORK = "192.168.55.0/24";
const CACHE_FILE = process.env.AURA_NETWORK_CACHE_FILE
  ?? join(process.cwd(), ".data", "network-devices-cache.json");

interface NetworkDevice {
  ip: string;
  mac?: string;
  hostname?: string;
  vendor?: string;
  type: string;
  online: boolean;
  source: string;
  lastSeen: string;
  ports?: number[];
  services?: string[];
  confidence?: "sicher" | "geschätzt" | "unbekannt";
}

interface ScanResult {
  scannedAt: string;
  network: string;
  devices: NetworkDevice[];
  method: string;
}

let cache: { at: number; result: ScanResult } | undefined;

export const Route = createFileRoute("/api/network-devices")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const refresh = url.searchParams.get("refresh") === "1";

        if (!refresh) {
          const cached = cache?.result ?? await readStoredScan();
          if (cached) {
            cache = { at: Date.now(), result: cached };
            return Response.json(cached, {
              headers: { "cache-control": "no-store" },
            });
          }
        }

        try {
          const result = await scanNetwork();
          cache = { at: Date.now(), result };
          await storeScan(result);
          return Response.json(result, {
            headers: { "cache-control": "no-store" },
          });
        } catch (error) {
          return Response.json(
            {
              error: "network_scan_failed",
              message: error instanceof Error ? error.message : String(error),
            },
            { status: 500 },
          );
        }
      },
    },
  },
});

async function readStoredScan(): Promise<ScanResult | undefined> {
  try {
    const raw = await readFile(CACHE_FILE, "utf8");
    const parsed = JSON.parse(raw) as ScanResult;
    if (!parsed.scannedAt || !Array.isArray(parsed.devices)) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

async function storeScan(result: ScanResult): Promise<void> {
  await mkdir(dirname(CACHE_FILE), { recursive: true });
  await writeFile(CACHE_FILE, JSON.stringify(result, null, 2), "utf8");
}

async function scanNetwork(): Promise<ScanResult> {
  const network = await detectNetwork();
  const toolState = {
    nmap: await commandExists("nmap"),
    arpScan: await commandExists("arp-scan"),
    avahi: await commandExists("avahi-browse"),
  };
  const baseDevices = toolState.nmap
    ? await scanWithNmap(network)
    : await scanWithPingAndNeighbors(network);
  const merged = mergeDevices(
    baseDevices,
    toolState.arpScan ? await scanWithArpScan() : [],
    await readNeighbors(),
    toolState.avahi ? await scanWithAvahi() : [],
  );
  const withPorts = toolState.nmap ? await attachPortInfo(merged) : merged;

  return {
    scannedAt: new Date().toISOString(),
    network,
    devices: withPorts
      .map(enrichDevice)
      .sort((a, b) => compareIp(a.ip, b.ip)),
    method: [
      toolState.nmap ? "nmap" : undefined,
      toolState.arpScan ? "arp-scan" : undefined,
      toolState.avahi ? "mdns" : undefined,
      "arp",
    ].filter(Boolean).join("+"),
  };
}

async function detectNetwork(): Promise<string> {
  const route = await run("ip", ["-o", "-4", "route", "show", "scope", "link"]);
  const match = route.match(/\b(\d{1,3}(?:\.\d{1,3}){3}\/\d{1,2})\b/);
  return match?.[1] ?? DEFAULT_NETWORK;
}

async function scanWithNmap(network: string): Promise<NetworkDevice[]> {
  const output = await run("nmap", ["-sn", network]);
  const devices: NetworkDevice[] = [];
  let current: Partial<NetworkDevice> | undefined;

  for (const line of output.split(/\r?\n/)) {
    const report = line.match(/^Nmap scan report for (?:(.*?) \()?(\d{1,3}(?:\.\d{1,3}){3})\)?$/);
    if (report) {
      if (current?.ip) devices.push(current as NetworkDevice);
      current = {
        ip: report[2],
        hostname: report[1] && report[1] !== report[2] ? cleanHostname(report[1]) : undefined,
        online: true,
        source: "nmap",
        lastSeen: new Date().toISOString(),
        type: "Unbekannt",
      };
      continue;
    }

    const mac = line.match(/^MAC Address:\s+([0-9A-F:]{17})(?:\s+\((.*?)\))?/i);
    if (mac && current) {
      current.mac = normalizeMac(mac[1]);
      current.vendor = cleanVendor(mac[2]);
    }
  }

  if (current?.ip) devices.push(current as NetworkDevice);
  return devices;
}

async function scanWithArpScan(): Promise<NetworkDevice[]> {
  const output = await run("arp-scan", ["--localnet", "--retry=1", "--timeout=500"]).catch(() => "");
  const now = new Date().toISOString();
  return output
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(/^(\d{1,3}(?:\.\d{1,3}){3})\s+([0-9a-f:]{17})\s+(.+)$/i);
      if (!match) return undefined;
      const vendor = cleanVendor(match[3]);
      return {
        ip: match[1],
        mac: normalizeMac(match[2]),
        vendor,
        online: true,
        source: "arp-scan",
        lastSeen: now,
        type: "Unbekannt",
      } satisfies NetworkDevice;
    })
    .filter((device): device is NetworkDevice => Boolean(device));
}

async function scanWithAvahi(): Promise<NetworkDevice[]> {
  const output = await run("timeout", ["8", "avahi-browse", "-art"], 10_000).catch(() => "");
  const now = new Date().toISOString();
  const devices: NetworkDevice[] = [];
  let current: Partial<NetworkDevice> & { services?: string[]; ports?: number[] } | undefined;

  for (const line of output.split(/\r?\n/)) {
    const start = line.match(/^[+=]\s+\S+\s+IPv4\s+(.+?)\s{2,}(.+?)\s+local\s*$/);
    if (start) {
      current = {
        hostname: cleanMdnsName(start[1]),
        services: [start[2].trim()],
        online: true,
        source: "mdns",
        lastSeen: now,
        type: "Unbekannt",
      };
      continue;
    }

    if (!current) continue;
    const hostname = line.match(/hostname = \[(.+?)\]/);
    if (hostname && !current.hostname) current.hostname = cleanMdnsName(hostname[1]);

    const address = line.match(/address = \[(\d{1,3}(?:\.\d{1,3}){3})\]/);
    if (address) current.ip = address[1];

    const port = line.match(/port = \[(\d+)\]/);
    if (port) current.ports = uniqueNumbers([...(current.ports ?? []), Number(port[1])]);

    const txt = line.match(/txt = \[(.+)\]/);
    if (txt) {
      const values = txt[1].toLowerCase();
      if (values.includes("shelly")) current.vendor = "Shelly";
      if (values.includes("hyperhdr") || values.includes("hyperion")) current.type = "Hyperion";
    }

    if (current.ip && (line.startsWith("   txt =") || line.trim() === "")) {
      devices.push(current as NetworkDevice);
      current = undefined;
    }
  }

  if (current?.ip) devices.push(current as NetworkDevice);
  return devices;
}

async function attachPortInfo(devices: NetworkDevice[]): Promise<NetworkDevice[]> {
  const ips = devices.map((device) => device.ip).filter(Boolean);
  if (ips.length === 0) return devices;

  const ports = [
    21, 22, 23, 53, 80, 81, 443, 445, 548, 554, 1883, 3000, 5000, 5357,
    8006, 8080, 8081, 8087, 8090, 8100, 8123, 8443, 8883, 9000, 9090, 9590,
  ].join(",");
  const output = await run(
    "nmap",
    ["-sT", "-Pn", "--open", "-p", ports, ...ips],
    45_000,
  ).catch(() => "");
  const byIp = parseNmapPorts(output);

  return devices.map((device) => {
    const info = byIp.get(device.ip);
    if (!info) return device;
    return {
      ...device,
      ports: uniqueNumbers([...(device.ports ?? []), ...info.ports]),
      services: uniqueStrings([...(device.services ?? []), ...info.services]),
      source: appendSource(device.source, "ports"),
    };
  });
}

async function scanWithPingAndNeighbors(network: string): Promise<NetworkDevice[]> {
  const ips = listIps(network);
  await runLimited(ips, MAX_PING_CONCURRENCY, async (ip) => {
    await run("ping", ["-c", "1", "-W", "1", ip], PING_TIMEOUT_MS).catch(() => "");
  });

  return (await readNeighbors()).map((device) => ({
    ...device,
    online: true,
    source: "arp",
    lastSeen: new Date().toISOString(),
    type: "Unbekannt",
  }));
}

async function readNeighbors(): Promise<NetworkDevice[]> {
  const output = await run("ip", ["neigh", "show"]).catch(() => "");
  const now = new Date().toISOString();
  return output
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(/^(\d{1,3}(?:\.\d{1,3}){3}).*?\blladdr\s+([0-9a-f:]{17})\b.*?\s([A-Z]+)$/i);
      if (!match) return undefined;
      const state = match[3].toUpperCase();
      if (["FAILED", "INCOMPLETE"].includes(state)) return undefined;
      return {
        ip: match[1],
        mac: normalizeMac(match[2]),
        online: true,
        source: "arp",
        lastSeen: now,
        type: "Unbekannt",
      } satisfies NetworkDevice;
    })
    .filter((device): device is NetworkDevice => Boolean(device));
}

function mergeDevices(...groups: NetworkDevice[][]): NetworkDevice[] {
  const byIp = new Map<string, NetworkDevice>();
  for (const device of groups.flat()) {
    const existing = byIp.get(device.ip);
    byIp.set(device.ip, existing ? mergeDevice(existing, device) : device);
  }
  return [...byIp.values()];
}

function mergeDevice(left: NetworkDevice, right: NetworkDevice): NetworkDevice {
  return {
    ...left,
    ...right,
    hostname: bestHostname(left.hostname, right.hostname),
    mac: left.mac ?? right.mac,
    vendor: bestVendor(left.vendor, right.vendor),
    type: left.type !== "Unbekannt" ? left.type : right.type,
    online: left.online || right.online,
    source: uniqueStrings([left.source, right.source]).join("+"),
    lastSeen: left.lastSeen > right.lastSeen ? left.lastSeen : right.lastSeen,
    ports: uniqueNumbers([...(left.ports ?? []), ...(right.ports ?? [])]),
    services: uniqueStrings([...(left.services ?? []), ...(right.services ?? [])]),
  };
}

function enrichDevice(device: NetworkDevice): NetworkDevice {
  const vendor = bestVendor(device.vendor, vendorFromMac(device.mac));
  const hostname = device.hostname ?? knownName(device.ip);
  const type = inferType(device.ip, hostname, vendor, device.ports, device.services);
  return {
    ...device,
    vendor,
    hostname,
    type,
    confidence: confidenceFor(type, hostname, vendor, device.ports, device.services),
  };
}

function knownName(ip: string): string | undefined {
  if (ip.endsWith(".1")) return "Router";
  if (ip === "192.168.55.4") return "ioBroker";
  if (ip === "192.168.55.168") return "Aura Home";
  return undefined;
}

function inferType(
  ip: string,
  hostname?: string,
  vendor?: string,
  ports: number[] = [],
  services: string[] = [],
): string {
  const text = `${hostname ?? ""} ${vendor ?? ""} ${services.join(" ")}`.toLowerCase();
  const normalizedHostname = (hostname ?? "").toLowerCase();
  if (ip.endsWith(".1") || normalizedHostname === "fritz.box" || text.includes("avm")) return "Router";
  if (normalizedHostname.includes("repeater") || text.includes("_fbox") || text.includes("_tr064")) return "Repeater";
  if (ip === "192.168.55.4" || text.includes("iobroker")) return "Smart-Home-Server";
  if (ports.includes(8081) || ports.includes(8087)) return "Smart-Home-Server";
  if (ip === "192.168.55.168" || text.includes("aura")) return "Aura-Server";
  if (text.includes("pihole") || ports.includes(53)) return "DNS/Pi-hole";
  if (text.includes("esphome")) return "ESPHome";
  if (text.includes("hyperion") || text.includes("hyperhdr") || ports.includes(8090)) return "Hyperion";
  if (text.includes("zidoo")) return "Media-Player";
  if (text.includes("marantz") || text.includes("d&m holdings")) return "AV-Receiver";
  if (ports.includes(8006) || normalizedHostname.includes("proxmox")) return "Proxmox";
  if (text.includes("nas") || ports.includes(445) || ports.includes(548)) return "NAS";
  if (text.includes("apple") || text.includes("iphone") || text.includes("ipad") || text.includes("mac")) return "Apple-Gerät";
  if (text.includes("ipad")) return "Tablet";
  if (text.includes("sony") || text.includes("bravia") || text.includes("googlecast")) return "TV";
  if (text.includes("spotify-connect") || text.includes("spotifyconnect")) return "Media-Player";
  if (text.includes("samsung") || text.includes("android")) return "Android/TV";
  if (text.includes("shelly")) return "Shelly";
  if (text.includes("wled")) return "WLED";
  if (text.includes("tuya") || text.includes("sonoff") || text.includes("espressif") || text.includes("hi-flying")) return "Smart-Home-Gerät";
  if (text.includes("linux") || ports.includes(22)) return "Server";
  return "Unbekannt";
}

function vendorFromMac(mac?: string): string | undefined {
  if (!mac) return undefined;
  const oui = mac.split(":").slice(0, 3).join(":").toUpperCase();
  const map: Record<string, string> = {
    "44:4E:6D": "AVM",
    "BC:24:11": "Proxmox/QEMU",
    "C4:5B:BE": "Tuya/Smart Life",
    "A8:48:FA": "Sonoff",
    "8C:AA:B5": "Shelly/Espressif",
    "84:F3:EB": "Shelly",
    "AC:CF:23": "Hi-Flying",
    "00:06:78": "D&M Holdings",
    "00:08:9B": "ICP Electronics",
    "68:54:FD": "Amazon",
    "B0:FC:0D": "Amazon",
    "F0:18:98": "Apple",
    "28:CF:E9": "Apple",
    "DC:A6:32": "Raspberry Pi",
  };
  return map[oui];
}

function listIps(network: string): string[] {
  const match = network.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.0\/24$/);
  if (!match) return [];
  const prefix = `${match[1]}.${match[2]}.${match[3]}`;
  return Array.from({ length: 254 }, (_, index) => `${prefix}.${index + 1}`);
}

async function runLimited<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>) {
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const item = items[index++];
      await fn(item);
    }
  });
  await Promise.all(workers);
}

async function commandExists(command: string): Promise<boolean> {
  return run("sh", ["-lc", `command -v ${command}`]).then(Boolean).catch(() => false);
}

async function run(command: string, args: string[], timeout = 20_000): Promise<string> {
  const { stdout } = await execFileAsync(command, args, {
    timeout,
    maxBuffer: 1024 * 1024 * 4,
  });
  return stdout;
}

function normalizeMac(mac?: string): string | undefined {
  return mac?.split(":").map((part) => part.padStart(2, "0")).join(":").toUpperCase();
}

function compareIp(a: string, b: string): number {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let index = 0; index < 4; index += 1) {
    const diff = (left[index] ?? 0) - (right[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function parseNmapPorts(output: string): Map<string, { ports: number[]; services: string[] }> {
  const byIp = new Map<string, { ports: number[]; services: string[] }>();
  let currentIp: string | undefined;

  for (const line of output.split(/\r?\n/)) {
    const report = line.match(/^Nmap scan report for (?:(.*?) \()?(\d{1,3}(?:\.\d{1,3}){3})\)?$/);
    if (report) {
      currentIp = report[2];
      byIp.set(currentIp, byIp.get(currentIp) ?? { ports: [], services: [] });
      continue;
    }

    const port = line.match(/^(\d+)\/tcp\s+open\s+(\S+)/);
    if (port && currentIp) {
      const info = byIp.get(currentIp) ?? { ports: [], services: [] };
      info.ports = uniqueNumbers([...info.ports, Number(port[1])]);
      info.services = uniqueStrings([...info.services, port[2]]);
      byIp.set(currentIp, info);
    }
  }

  return byIp;
}

function cleanVendor(value?: string): string | undefined {
  if (!value) return undefined;
  const cleaned = value.trim().replace(/\s+Co\.,Ltd\.?$/i, "");
  if (/unknown/i.test(cleaned)) return undefined;
  if (/ieee registration authority/i.test(cleaned)) return undefined;
  return cleaned;
}

function cleanMdnsName(value: string): string {
  return cleanHostname(value
    .replace(/\\(\d{3})/g, (_, code) => String.fromCharCode(Number(code)))
    .trim());
}

function cleanHostname(value: string): string {
  return value
    .replace(/\s+_[a-z0-9-]+\._tcp.*$/i, "")
    .replace(/\s+\[[0-9a-f:]{17}\]$/i, "")
    .replace(/\.fritz\.box$/i, "")
    .replace(/\.local$/i, "")
    .trim();
}

function bestHostname(left?: string, right?: string): string | undefined {
  const candidates = [left, right].filter(Boolean) as string[];
  return candidates.sort((a, b) => hostnameScore(b) - hostnameScore(a))[0];
}

function hostnameScore(value: string): number {
  const normalized = value.toLowerCase();
  let score = value.length;
  if (normalized.includes(".fritz.box")) score += 30;
  if (normalized.includes(".local")) score += 20;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) score -= 100;
  if (/^[0-9a-f:-]+$/i.test(value)) score -= 20;
  return score;
}

function bestVendor(left?: string, right?: string): string | undefined {
  const candidates = [left, right].filter(Boolean) as string[];
  return candidates.sort((a, b) => vendorScore(b) - vendorScore(a))[0];
}

function vendorScore(value: string): number {
  if (/shelly|d&m|avm|apple|amazon|qnap|synology|raspberry|proxmox/i.test(value)) return 80;
  if (/espressif/i.test(value)) return 30;
  if (value.length > 12) return 20;
  if (value.includes("/")) return 10;
  return value.length;
}

function confidenceFor(
  type: string,
  hostname?: string,
  vendor?: string,
  ports: number[] = [],
  services: string[] = [],
): "sicher" | "geschätzt" | "unbekannt" {
  if (type === "Unbekannt") return "unbekannt";
  const text = `${hostname ?? ""} ${vendor ?? ""} ${services.join(" ")}`.toLowerCase();
  if (services.length > 0 || ports.length > 0) return "sicher";
  if (/(iobroker|proxmox|pihole|esphome|marantz|zidoo|shelly|fritz|nas|hyperion)/.test(text)) return "sicher";
  return "geschätzt";
}

function appendSource(source: string, addition: string): string {
  return uniqueStrings([...source.split("+"), addition]).join("+");
}

function uniqueStrings(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function uniqueNumbers(values: number[]): number[] {
  return [...new Set(values.filter((value) => Number.isFinite(value)))].sort((a, b) => a - b);
}
