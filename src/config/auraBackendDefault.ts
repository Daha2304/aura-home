import { createServerConfig, type ServerConfig } from "@/models/server";

const DEFAULT_ID = "srv-aura-backend-default";
const DEFAULT_PROXY_PATH = "/aura-backend";

function readEnv(name: string): string | undefined {
  const value = (import.meta.env[name] as string | undefined)?.trim();
  return value ? value : undefined;
}

function readPort(): number {
  const raw = readEnv("VITE_AURA_BACKEND_PORT");
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (Number.isInteger(parsed) && parsed > 0 && parsed <= 65535) return parsed;
  return defaultPort();
}

function readEnabled(): boolean {
  return readEnv("VITE_AURA_BACKEND_AUTO_SEED")?.toLowerCase() !== "false";
}

export function createDefaultAuraBackendServer(): ServerConfig | undefined {
  if (!readEnabled()) return undefined;

  return createServerConfig({
    id: DEFAULT_ID,
    name: readEnv("VITE_AURA_BACKEND_NAME") ?? "Aura Backend",
    host: readEnv("VITE_AURA_BACKEND_HOST") ?? defaultHost(),
    port: readPort(),
    ssl: readSsl(),
    path: readEnv("VITE_AURA_BACKEND_PATH") ?? DEFAULT_PROXY_PATH,
    auth: {
      type: "token",
      token: readEnv("VITE_AURA_BACKEND_TOKEN") ?? "1234qwer",
    },
    active: true,
    autoConnect: true,
    favorite: true,
  });
}

export function normalizeAuraBackendServerForCurrentOrigin(server: ServerConfig): ServerConfig {
  if (!isDefaultAuraBackendServer(server) || !isBrowserPage()) return server;

  const host = defaultHost();
  const port = defaultPort();
  const ssl = defaultSsl();
  if (server.host === host && server.port === port && server.ssl === ssl && server.path === DEFAULT_PROXY_PATH) {
    return server;
  }

  return {
    ...server,
    host,
    port,
    ssl,
    path: DEFAULT_PROXY_PATH,
    updatedAt: Date.now(),
  };
}

function isDefaultAuraBackendServer(server: ServerConfig): boolean {
  const name = server.name.toLowerCase();
  return (
    server.id === DEFAULT_ID ||
    name.includes("aura") ||
    server.path === DEFAULT_PROXY_PATH ||
    server.host === "192.168.55.4" ||
    server.host === "192.168.55.168" ||
    server.port === 8099 ||
    server.port === 8100
  );
}

function readSsl(): boolean {
  const raw = readEnv("VITE_AURA_BACKEND_SSL");
  if (raw) return raw !== "false";
  return defaultSsl();
}

function isBrowserPage(): boolean {
  return typeof window !== "undefined" && Boolean(window.location.protocol);
}

function defaultSsl(): boolean {
  return typeof window !== "undefined" ? window.location.protocol === "https:" : true;
}

function defaultHost(): string {
  if (typeof window !== "undefined" && window.location.hostname) return window.location.hostname;
  return "192.168.55.168";
}

function defaultPort(): number {
  if (typeof window !== "undefined" && window.location.port) {
    const parsed = Number.parseInt(window.location.port, 10);
    if (Number.isInteger(parsed) && parsed > 0 && parsed <= 65535) return parsed;
  }
  return defaultSsl() ? 443 : 80;
}

export function ensureDefaultAuraBackendServer(
  servers: ServerConfig[],
  activeServerId: string | undefined,
): { servers: ServerConfig[]; activeServerId: string | undefined } {
  if (servers.length > 0) return { servers, activeServerId };

  const fallback = createDefaultAuraBackendServer();
  if (!fallback) return { servers, activeServerId };
  return { servers: [fallback], activeServerId: fallback.id };
}
