import { createServerConfig, type ServerConfig, type ServerDraft } from "@/models/server";
import { AppError } from "@/services/errors/AppError";

const EXPORT_VERSION = 1;

interface ExportBundle {
  version: number;
  exportedAt: number;
  servers: ServerConfig[];
}

export function serializeServers(servers: ServerConfig[]): string {
  const bundle: ExportBundle = {
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    servers,
  };
  return JSON.stringify(bundle, null, 2);
}

export function downloadServersFile(servers: ServerConfig[], filename = "smarthome-servers.json"): void {
  const blob = new Blob([serializeServers(servers)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseServersImport(text: string): ServerConfig[] {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    throw new AppError("parse", "Datei ist kein gültiges JSON", {
      code: "IMPORT_JSON",
      cause: err,
    });
  }
  if (!raw || typeof raw !== "object" || !("servers" in raw))
    throw new AppError("invalid_message", "Kein gültiges Server-Backup", {
      code: "IMPORT_SHAPE",
    });
  const arr = (raw as { servers: unknown }).servers;
  if (!Array.isArray(arr))
    throw new AppError("invalid_message", "„servers“ ist keine Liste", {
      code: "IMPORT_SHAPE",
    });

  return arr.map((item, idx) => {
    if (!item || typeof item !== "object")
      throw new AppError("invalid_message", `Eintrag ${idx + 1} ist ungültig`, {
        code: "IMPORT_ITEM",
      });
    const draft = item as ServerDraft;
    if (!draft.host || !draft.port)
      throw new AppError(
        "invalid_message",
        `Eintrag ${idx + 1}: Host oder Port fehlt`,
        { code: "IMPORT_ITEM" },
      );
    return createServerConfig(draft);
  });
}
