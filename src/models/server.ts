import type { ID } from "./common";
import { createId } from "@/utils/ids";

export type ServerAuthType = "none" | "password" | "token" | "basic";

export interface ServerAuth {
  type: ServerAuthType;
  password?: string;
  token?: string;
  username?: string;
}

export interface ServerConfig {
  id: ID;
  name: string;
  description?: string;
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
  favorite?: boolean;
  color?: string;
  icon?: string;
  image?: string;
  notes?: string;
  lastConnectedAt?: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Baut die vollständige WebSocket-URL aus einer ServerConfig.
 * Keine Hardcodings — alle Werte kommen aus den Einstellungen.
 */
export function buildServerUrl(
  cfg: Pick<ServerConfig, "host" | "port" | "ssl" | "path">,
): string {
  const scheme = cfg.ssl ? "wss" : "ws";
  const path = cfg.path && cfg.path.startsWith("/") ? cfg.path : "";
  return `${scheme}://${cfg.host}:${cfg.port}${path}`;
}

export type ServerDraft = Partial<Omit<ServerConfig, "auth">> & {
  auth?: Partial<ServerAuth>;
};

export function createServerConfig(draft: ServerDraft = {}): ServerConfig {
  const now = Date.now();
  return {
    id: draft.id ?? createId("srv"),
    name: draft.name?.trim() || "Neuer Server",
    description: draft.description,
    host: draft.host?.trim() ?? "",
    port: typeof draft.port === "number" ? draft.port : 8099,
    ssl: draft.ssl ?? false,
    path: draft.path,
    auth: {
      type: draft.auth?.type ?? "none",
      password: draft.auth?.password,
      token: draft.auth?.token,
      username: draft.auth?.username,
    },
    active: draft.active ?? false,
    autoConnect: draft.autoConnect ?? true,
    favorite: draft.favorite,
    color: draft.color,
    icon: draft.icon,
    image: draft.image,
    notes: draft.notes,
    lastConnectedAt: draft.lastConnectedAt,
    createdAt: draft.createdAt ?? now,
    updatedAt: now,
  };
}

export type ServerValidationErrors = Partial<
  Record<
    | "name"
    | "host"
    | "port"
    | "path"
    | "auth.username"
    | "auth.password"
    | "auth.token",
    string
  >
>;

export interface ServerValidationResult {
  ok: boolean;
  errors: ServerValidationErrors;
}

const HOST_RE = /^([a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?)(\.[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?)*$|^(\d{1,3}\.){3}\d{1,3}$|^\[?[0-9a-fA-F:]+\]?$/;

export function validateServerConfig(
  draft: ServerDraft,
): ServerValidationResult {
  const errors: ServerValidationErrors = {};
  const name = draft.name?.trim() ?? "";
  if (!name) errors.name = "Name ist erforderlich";
  else if (name.length > 60) errors.name = "Name zu lang";

  const host = draft.host?.trim() ?? "";
  if (!host) errors.host = "Host ist erforderlich";
  else if (!HOST_RE.test(host)) errors.host = "Ungültiger Host oder IP";

  const port = draft.port;
  if (typeof port !== "number" || Number.isNaN(port))
    errors.port = "Port ist erforderlich";
  else if (!Number.isInteger(port) || port < 1 || port > 65535)
    errors.port = "Port muss zwischen 1 und 65535 liegen";

  if (draft.path && !draft.path.startsWith("/"))
    errors.path = "Pfad muss mit „/“ beginnen";

  const authType = draft.auth?.type ?? "none";
  if (authType === "password") {
    if (!draft.auth?.password) errors["auth.password"] = "Passwort erforderlich";
  } else if (authType === "token") {
    if (!draft.auth?.token) errors["auth.token"] = "Token erforderlich";
  } else if (authType === "basic") {
    if (!draft.auth?.username)
      errors["auth.username"] = "Benutzername erforderlich";
    if (!draft.auth?.password)
      errors["auth.password"] = "Passwort erforderlich";
  }

  return { ok: Object.keys(errors).length === 0, errors };
}
