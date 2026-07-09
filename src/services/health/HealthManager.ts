/**
 * HealthManager + HealthCheckRegistry
 *
 * Read-only Diagnose über bestehende Systeme. Kein Selbst-Reparieren.
 * Neue Checks werden ausschließlich über healthCheckRegistry.register()
 * hinzugefügt — keine Änderung an diesem Modul nötig.
 */
import { create } from "zustand";
import { createLogger } from "@/services/logger/Logger";

const log = createLogger("health");

export type HealthStatus = "ok" | "warn" | "fail" | "unknown";

export interface HealthResult {
  status: HealthStatus;
  detail?: string;
  metrics?: Record<string, number | string>;
}

export interface HealthCheck {
  id: string;
  label: string;
  category?: "core" | "network" | "storage" | "registry" | "runtime";
  run: () => Promise<HealthResult> | HealthResult;
}

export interface HealthReport {
  id: string;
  label: string;
  category: string;
  result: HealthResult;
  ranAt: number;
}

// Registry ---------------------------------------------------------------

class HealthCheckRegistry {
  private readonly checks = new Map<string, HealthCheck>();

  register(check: HealthCheck): () => void {
    this.checks.set(check.id, check);
    return () => this.unregister(check.id);
  }

  unregister(id: string): void {
    this.checks.delete(id);
  }

  list(): HealthCheck[] {
    return Array.from(this.checks.values());
  }

  get(id: string): HealthCheck | undefined {
    return this.checks.get(id);
  }
}

export const healthCheckRegistry = new HealthCheckRegistry();

// Store ------------------------------------------------------------------

interface HealthState {
  reports: HealthReport[];
  lastRunAt: number | null;
  running: boolean;
  setReports: (reports: HealthReport[]) => void;
  setRunning: (running: boolean) => void;
}

export const useHealthStore = create<HealthState>((set) => ({
  reports: [],
  lastRunAt: null,
  running: false,
  setReports: (reports) => set({ reports, lastRunAt: Date.now() }),
  setRunning: (running) => set({ running }),
}));

// Manager ----------------------------------------------------------------

class HealthManager {
  private timer: ReturnType<typeof setInterval> | null = null;

  start(intervalMs = 60_000): void {
    if (typeof window === "undefined") return;
    this.stop();
    void this.runAll();
    this.timer = setInterval(() => void this.runAll(), intervalMs);
  }

  stop(): void {
    if (this.timer != null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async runAll(): Promise<HealthReport[]> {
    const store = useHealthStore.getState();
    store.setRunning(true);
    const now = Date.now();
    const checks = healthCheckRegistry.list();
    const reports: HealthReport[] = [];
    for (const check of checks) {
      try {
        const result = await check.run();
        reports.push({
          id: check.id,
          label: check.label,
          category: check.category ?? "runtime",
          result,
          ranAt: now,
        });
      } catch (err) {
        log.warn("health check failed", check.id, err);
        reports.push({
          id: check.id,
          label: check.label,
          category: check.category ?? "runtime",
          result: { status: "fail", detail: String(err) },
          ranAt: now,
        });
      }
    }
    store.setReports(reports);
    store.setRunning(false);
    return reports;
  }

  summary(): HealthStatus {
    const reports = useHealthStore.getState().reports;
    if (reports.length === 0) return "unknown";
    if (reports.some((r) => r.result.status === "fail")) return "fail";
    if (reports.some((r) => r.result.status === "warn")) return "warn";
    if (reports.every((r) => r.result.status === "ok")) return "ok";
    return "unknown";
  }
}

export const healthManager = new HealthManager();
