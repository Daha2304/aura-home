import { AppError } from "@/services/errors/AppError";
import { errorBus } from "@/services/errors/ErrorBus";
import { createLogger } from "@/services/logger/Logger";
import type { Dashboard, DashboardId } from "@/models/dashboard";
import type { LayoutBreakpoint, LayoutGrid } from "@/models/layout";
import type { WidgetInstance } from "@/models/widgetInstance";

const log = createLogger("dashboard-cache");

const KEY = "smarthome.cache.dashboards";
const CURRENT_SCHEMA = 1;

export interface DashboardCacheSnapshot {
  schemaVersion: number;
  updatedAt: number;
  dashboards: Dashboard[];
  order: DashboardId[];
  activeId: DashboardId | null;
  widgets: WidgetInstance[];
  layouts: Array<{
    dashboardId: DashboardId;
    breakpoint: LayoutBreakpoint;
    grid: LayoutGrid;
  }>;
}

type Migration = (input: unknown) => DashboardCacheSnapshot | null;
const MIGRATIONS: Record<number, Migration> = {};

function migrate(raw: unknown): DashboardCacheSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  let cur = raw as { schemaVersion?: number } & Record<string, unknown>;
  while (typeof cur.schemaVersion === "number" && cur.schemaVersion < CURRENT_SCHEMA) {
    const m = MIGRATIONS[cur.schemaVersion];
    if (!m) return null;
    const next = m(cur);
    if (!next) return null;
    cur = next as unknown as typeof cur;
  }
  if (cur.schemaVersion !== CURRENT_SCHEMA) return null;
  return cur as unknown as DashboardCacheSnapshot;
}

class DashboardCacheImpl {
  private persistTimer: ReturnType<typeof setTimeout> | null = null;

  hydrate(): DashboardCacheSnapshot | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      const migrated = migrate(JSON.parse(raw));
      if (!migrated) {
        errorBus.report(
          new AppError("parse", "Dashboard-Cache konnte nicht migriert werden", {
            code: "dashboard_cache_migration_failed",
          }),
        );
        return null;
      }
      log.debug("hydrated", migrated.dashboards.length, "dashboards");
      return migrated;
    } catch (err) {
      errorBus.report(
        new AppError("parse", "Dashboard-Cache-Lesefehler", {
          cause: err,
          code: "dashboard_cache_read_failed",
        }),
      );
      return null;
    }
  }

  persistDebounced(snap: Omit<DashboardCacheSnapshot, "schemaVersion" | "updatedAt">): void {
    if (typeof window === "undefined") return;
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => this.persistNow(snap), 250);
  }

  persistNow(snap: Omit<DashboardCacheSnapshot, "schemaVersion" | "updatedAt">): void {
    if (typeof window === "undefined") return;
    try {
      const payload: DashboardCacheSnapshot = {
        schemaVersion: CURRENT_SCHEMA,
        updatedAt: Date.now(),
        ...snap,
      };
      window.localStorage.setItem(KEY, JSON.stringify(payload));
    } catch (err) {
      errorBus.report(
        new AppError("parse", "Dashboard-Cache-Schreibfehler", {
          cause: err,
          code: "dashboard_cache_write_failed",
        }),
      );
    }
  }

  clear(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(KEY);
  }
}

export const dashboardCache = new DashboardCacheImpl();
export const DASHBOARD_CACHE_SCHEMA_VERSION = CURRENT_SCHEMA;
