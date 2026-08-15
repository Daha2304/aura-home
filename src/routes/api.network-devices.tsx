import { createFileRoute } from "@tanstack/react-router";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const CACHE_MS = 120_000;
const PING_TIMEOUT_MS = 900;
const MAX_PING_CONCURRENCY = 48;
const DEFAULT_NETWORK = "192.168.55.0/24";

interface NetworkDevice {
  ip: string;
  mac?: string;
  hostname?: string;
  vendor?: string;
  type: string;
  online: boolean;
  source: string;
  lastSeen: string;
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

        if (!refresh && cache && Date.now() - cache.at < CACHE_MS) {
          return Response.json(cache.result, {
            headers: { "cache-control": "private, max-age=60" },
          });
        }

        try {
          const result = await scanNetwork();
          cache = { at: Date.now(), result };
          return Response.json(result, {
            headers: { "cache-control": "private, max-age=60" },
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

async function scanNetwork(): Promise<ScanResult> {
  const network = await detectNetwork();
  const nmap = await commandExists("nmap");
  const devices = nmap
    ? await scanWithNmap(network)
    : await scanWithPingAndNeighbors(network);

  return {
    scannedAt: new Date().toISOString(),
    network,
    devices: devices
      .map(enrichDevice)
      .sort((a, b) => compareIp(a.ip, b.ip)),
    method: nmap ? "nmap" : "ping+arp",
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
        hostname: report[1] && report[1] !== report[2] ? report[1] : undefined,
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
      current.vendor = mac[2];
    }
  }

  if (current?.ip) devices.push(current as NetworkDevice);
  return mergeNeighbors(devices, await readNeighbors());
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

function mergeNeighbors(devices: NetworkDevice[], neighbors: NetworkDevice[]): NetworkDevice[] {
  const byIp = new Map(devices.map((device) => [device.ip, device]));
  for (const neighbor of neighbors) {
    const existing = byIp.get(neighbor.ip);
    if (existing) {
      byIp.set(neighbor.ip, {
        ...neighbor,
        ...existing,
        mac: existing.mac ?? neighbor.mac,
        vendor: existing.vendor ?? neighbor.vendor,
      });
    } else {
      byIp.set(neighbor.ip, neighbor);
    }
  }
  return [...byIp.values()];
}

function enrichDevice(device: NetworkDevice): NetworkDevice {
  const vendor = device.vendor ?? vendorFromMac(device.mac);
  return {
    ...device,
    vendor,
    hostname: device.hostname ?? knownName(device.ip),
    type: inferType(device.ip, device.hostname, vendor),
  };
}

function knownName(ip: string): string | undefined {
  if (ip.endsWith(".1")) return "Router";
  if (ip === "192.168.55.4") return "ioBroker";
  if (ip === "192.168.55.168") return "Aura Home";
  return undefined;
}

function inferType(ip: string, hostname?: string, vendor?: string): string {
  const text = `${hostname ?? ""} ${vendor ?? ""}`.toLowerCase();
  if (ip.endsWith(".1") || text.includes("fritz") || text.includes("avm")) return "Router";
  if (ip === "192.168.55.4" || text.includes("iobroker")) return "Smart-Home-Server";
  if (ip === "192.168.55.168" || text.includes("aura")) return "Aura-Server";
  if (text.includes("apple") || text.includes("iphone") || text.includes("ipad") || text.includes("mac")) return "Apple-Gerät";
  if (text.includes("samsung") || text.includes("android")) return "Android/TV";
  if (text.includes("sony")) return "TV";
  if (text.includes("shelly") || text.includes("tuya") || text.includes("sonoff")) return "Smart-Home-Gerät";
  if (text.includes("proxmox") || text.includes("linux")) return "Server";
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
    "84:F3:EB": "Shelly",
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
