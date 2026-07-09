/**
 * BackupManager — registry-based, non-breaking backup / restore.
 *
 * Every domain area registers a `BackupProviderDescriptor` (id, label,
 * schemaVersion, export(), import(mode, data)). The manager composes a
 * single JSON payload with a schemaVersion, appVersion, dataModelVersion
 * envelope. Migrations run per-provider via `migrationManager`.
 */
import { createLogger } from "@/services/logger/Logger";
import { APP_VERSION, DATA_MODEL_VERSION, BACKUP_VERSION } from "@/services/version";
import { migrationManager } from "@/services/version";

const log = createLogger("backup");

export type RestoreMode = "replace" | "merge";

export interface BackupProviderDescriptor<T = unknown> {
  id: string;
  label: string;
  schemaVersion: number;
  export: () => T | Promise<T>;
  import: (data: T, mode: RestoreMode) => void | Promise<void>;
}

export interface BackupSection<T = unknown> {
  version: number;
  data: T;
}

export interface BackupEnvelope {
  schemaVersion: number;   // envelope schema
  appVersion: string;
  dataModelVersion: number;
  createdAt: number;
  sections: Record<string, BackupSection>;
}

class BackupProviderRegistry {
  private readonly entries = new Map<string, BackupProviderDescriptor>();

  register<T>(d: BackupProviderDescriptor<T>): () => void {
    this.entries.set(d.id, d as BackupProviderDescriptor);
    return () => this.entries.delete(d.id);
  }
  get(id: string): BackupProviderDescriptor | undefined {
    return this.entries.get(id);
  }
  list(): BackupProviderDescriptor[] {
    return Array.from(this.entries.values());
  }
  ids(): string[] { return Array.from(this.entries.keys()); }
}

export const backupProviderRegistry = new BackupProviderRegistry();

export interface ExportOptions {
  include?: string[]; // whitelist of provider ids; omitted = all
  exclude?: string[];
}

export interface ImportOptions {
  mode: RestoreMode;
  include?: string[]; // selective restore
}

export const backupManager = {
  async exportAll(opts: ExportOptions = {}): Promise<BackupEnvelope> {
    const providers = backupProviderRegistry.list().filter((p) => {
      if (opts.include && !opts.include.includes(p.id)) return false;
      if (opts.exclude && opts.exclude.includes(p.id)) return false;
      return true;
    });
    const sections: Record<string, BackupSection> = {};
    for (const p of providers) {
      try {
        const data = await p.export();
        sections[p.id] = { version: p.schemaVersion, data };
      } catch (err) {
        log.warn("export failed", p.id, err);
      }
    }
    return {
      schemaVersion: BACKUP_VERSION,
      appVersion: APP_VERSION,
      dataModelVersion: DATA_MODEL_VERSION,
      createdAt: Date.now(),
      sections,
    };
  },

  async importAll(envelope: BackupEnvelope, opts: ImportOptions): Promise<{
    imported: string[];
    skipped: string[];
    failed: string[];
  }> {
    if (!envelope || typeof envelope !== "object" || !envelope.sections) {
      throw new Error("Ungültiges Backup-Format");
    }
    if (envelope.schemaVersion !== BACKUP_VERSION) {
      log.info("backup schema differs", envelope.schemaVersion, "→", BACKUP_VERSION);
    }
    const imported: string[] = [];
    const skipped: string[] = [];
    const failed: string[] = [];
    for (const [id, section] of Object.entries(envelope.sections)) {
      if (opts.include && !opts.include.includes(id)) { skipped.push(id); continue; }
      const provider = backupProviderRegistry.get(id);
      if (!provider) { skipped.push(id); continue; }
      try {
        let data = section.data;
        if (section.version !== provider.schemaVersion) {
          data = await migrationManager.migratePayload(
            id,
            section.version,
            provider.schemaVersion,
            section.data,
          );
        }
        await provider.import(data, opts.mode);
        imported.push(id);
      } catch (err) {
        log.warn("import failed", id, err);
        failed.push(id);
      }
    }
    return { imported, skipped, failed };
  },

  toJSON(env: BackupEnvelope): string {
    return JSON.stringify(env, null, 2);
  },

  parseJSON(text: string): BackupEnvelope {
    const obj = JSON.parse(text) as BackupEnvelope;
    if (!obj || typeof obj !== "object") throw new Error("Ungültiges Backup-Format");
    return obj;
  },

  download(env: BackupEnvelope, filename?: string): void {
    if (typeof window === "undefined") return;
    const blob = new Blob([this.toJSON(env)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      filename ??
      `smarthome-backup-${new Date(env.createdAt).toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
