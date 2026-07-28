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
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 65535 ? parsed : 443;
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
    ssl: readEnv("VITE_AURA_BACKEND_SSL") !== "false",
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
  if (!isDefaultAuraBackendServer(server) || !isHttpsPage()) return server;

  const host = defaultHost();
  const port = defaultPort();
  if (server.host === host && server.port === port && server.ssl && server.path === DEFAULT_PROXY_PATH) {
    return server;
  }

  return {
    ...server,
    host,
    port,
    ssl: true,
    path: DEFAULT_PROXY_PATH,
    updatedAt: Date.now(),
  };
}

function isDefaultAuraBackendServer(server: ServerConfig): boolean {
  return server.id === DEFAULT_ID || server.name === "Aura Backend";
}

function isHttpsPage(): boolean {
  return typeof window !== "undefined" && window.location.protocol === "https:";
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
  return 443;
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
