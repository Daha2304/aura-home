import type { ID } from "./common";

export interface ServerAuth {
  type: "none" | "password" | "token" | "basic";
  password?: string;
  token?: string;
  username?: string;
}

export interface ServerConfig {
  id: ID;
  name: string;
  /** Hostname oder IP, ohne Schema und ohne Port. z.B. "192.168.55.4" */
  host: string;
  /** WebSocket-Port, z.B. 8099 */
  port: number;
  /** true → wss, false → ws */
  ssl: boolean;
  /** Optionaler Pfad, z.B. "/ws". Muss mit "/" beginnen, wenn gesetzt. */
  path?: string;
  auth: ServerAuth;
  active: boolean;
  /** Wenn true, verbindet der Manager beim Start automatisch. */
  autoConnect?: boolean;
}

/**
 * Baut die vollständige WebSocket-URL aus einer ServerConfig.
 * Keine Hardcodings — alle Werte kommen aus den Einstellungen.
 */
export function buildServerUrl(cfg: Pick<ServerConfig, "host" | "port" | "ssl" | "path">): string {
  const scheme = cfg.ssl ? "wss" : "ws";
  const path = cfg.path && cfg.path.startsWith("/") ? cfg.path : "";
  return `${scheme}://${cfg.host}:${cfg.port}${path}`;
}
