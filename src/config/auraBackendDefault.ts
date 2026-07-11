import { createServerConfig, type ServerConfig } from "@/models/server";

const DEFAULT_ID = "srv-aura-backend-default";

function readEnv(name: string): string | undefined {
  const value = (import.meta.env[name] as string | undefined)?.trim();
  return value ? value : undefined;
}

function readPort(): number {
  const raw = readEnv("VITE_AURA_BACKEND_PORT");
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 65535 ? parsed : 8100;
}

function readEnabled(): boolean {
  return readEnv("VITE_AURA_BACKEND_AUTO_SEED")?.toLowerCase() !== "false";
}

export function createDefaultAuraBackendServer(): ServerConfig | undefined {
  if (!readEnabled()) return undefined;

  return createServerConfig({
    id: DEFAULT_ID,
    name: readEnv("VITE_AURA_BACKEND_NAME") ?? "Aura Backend",
    host: readEnv("VITE_AURA_BACKEND_HOST") ?? "192.168.55.4",
    port: readPort(),
    ssl: readEnv("VITE_AURA_BACKEND_SSL") === "true",
    path: readEnv("VITE_AURA_BACKEND_PATH"),
    auth: {
      type: "token",
      token: readEnv("VITE_AURA_BACKEND_TOKEN") ?? "1234qwer",
    },
    active: true,
    autoConnect: true,
    favorite: true,
  });
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
