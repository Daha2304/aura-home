import type { Device } from "@/models/device";
import type { DeviceGroup } from "@/models/deviceGroup";
import { AppError } from "@/services/errors/AppError";
import { errorBus } from "@/services/errors/ErrorBus";
import { createLogger } from "@/services/logger/Logger";

const log = createLogger("cache");

const KEY = "smarthome.cache.devices";
const CURRENT_SCHEMA = 1;

export interface DeviceCacheSnapshot {
  schemaVersion: number;
  updatedAt: number;
  devices: Device[];
  groups: DeviceGroup[];
}

type Migration = (input: unknown) => DeviceCacheSnapshot | null;

/**
 * Migrationen von einer alten Schema-Version auf die nächste.
 * Beispiel: `1: (raw) => ({ ...zu Schema 2... })`.
 */
const MIGRATIONS: Record<number, Migration> = {};

function migrate(raw: unknown): DeviceCacheSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  let cur = raw as { schemaVersion?: number } & Record<string, unknown>;
  while (typeof cur.schemaVersion === "number" && cur.schemaVersion < CURRENT_SCHEMA) {
    const migrator = MIGRATIONS[cur.schemaVersion];
    if (!migrator) return null;
    const next = migrator(cur);
    if (!next) return null;
    cur = next as unknown as typeof cur;
  }
  if (cur.schemaVersion !== CURRENT_SCHEMA) return null;
  return cur as unknown as DeviceCacheSnapshot;
}

/**
 * Versionierter, lokaler Cache. Persistiert einen kompletten Snapshot
 * (`devices` + `groups`) mit `localStorage`. Der Cache ist Discovery-agnostisch —
 * er sagt nur "so sah es zuletzt aus".
 */
class DeviceCacheImpl {
  private persistTimer: ReturnType<typeof setTimeout> | null = null;

  hydrate(): DeviceCacheSnapshot | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as unknown;
      const migrated = migrate(parsed);
      if (!migrated) {
        errorBus.report(
          new AppError("parse", "Device-Cache konnte nicht migriert werden", {
            code: "cache_migration_failed",
          }),
        );
        return null;
      }
      log.debug("hydrated", migrated.devices.length, "devices");
      return migrated;
    } catch (err) {
      errorBus.report(
        new AppError("parse", "Device-Cache-Lesefehler", {
          cause: err,
          code: "cache_read_failed",
        }),
      );
      return null;
    }
  }

  persistDebounced(snap: Omit<DeviceCacheSnapshot, "schemaVersion" | "updatedAt">): void {
    if (typeof window === "undefined") return;
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => this.persistNow(snap), 250);
  }

  persistNow(snap: Omit<DeviceCacheSnapshot, "schemaVersion" | "updatedAt">): void {
    if (typeof window === "undefined") return;
    try {
      const payload: DeviceCacheSnapshot = {
        schemaVersion: CURRENT_SCHEMA,
        updatedAt: Date.now(),
        devices: snap.devices,
        groups: snap.groups,
      };
      window.localStorage.setItem(KEY, JSON.stringify(payload));
    } catch (err) {
      errorBus.report(
        new AppError("parse", "Device-Cache-Schreibfehler", {
          cause: err,
          code: "cache_write_failed",
        }),
      );
    }
  }

  clear(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(KEY);
  }
}

export const deviceCache = new DeviceCacheImpl();
