/**
 * MigrationManager — generic, registry-based data migrations.
 *
 * No concrete migrations ship in this part; only the architecture.
 * Providers register via `migrationRegistry.register({...})`. Chains from
 * an older schema version to the current one run in order at app start
 * and during backup restore.
 */
import { createLogger } from "@/services/logger/Logger";
import { versionManager } from "./VersionManager";

const log = createLogger("migration");

export interface MigrationDescriptor<T = unknown> {
  providerId: string;
  from: number;
  to: number;
  migrate: (data: T) => T | Promise<T>;
}

class MigrationRegistry {
  private readonly entries: MigrationDescriptor[] = [];
  register<T>(d: MigrationDescriptor<T>): () => void {
    this.entries.push(d as MigrationDescriptor);
    return () => {
      const i = this.entries.indexOf(d as MigrationDescriptor);
      if (i >= 0) this.entries.splice(i, 1);
    };
  }
  chainFor(providerId: string, from: number, to: number): MigrationDescriptor[] {
    if (from === to) return [];
    const chain: MigrationDescriptor[] = [];
    let cur = from;
    // Simple linear chain resolver.
    while (cur < to) {
      const step = this.entries.find(
        (e) => e.providerId === providerId && e.from === cur && e.to > cur,
      );
      if (!step) break;
      chain.push(step);
      cur = step.to;
    }
    return chain;
  }
  list(): MigrationDescriptor[] { return [...this.entries]; }
}

export const migrationRegistry = new MigrationRegistry();

export const migrationManager = {
  async migrate<T>(providerId: string, data: T, targetVersion: number): Promise<T> {
    const current = versionManager.getSchemaVersion(providerId);
    if (current === targetVersion) return data;
    const chain = migrationRegistry.chainFor(providerId, current, targetVersion);
    let value: unknown = data;
    for (const step of chain) {
      log.info("migrating", providerId, step.from, "→", step.to);
      value = await step.migrate(value);
      versionManager.setSchemaVersion(providerId, step.to);
    }
    return value as T;
  },

  async migratePayload<T>(providerId: string, from: number, to: number, data: T): Promise<T> {
    const chain = migrationRegistry.chainFor(providerId, from, to);
    let value: unknown = data;
    for (const step of chain) value = await step.migrate(value);
    return value as T;
  },

  async runPending(): Promise<void> {
    // Placeholder: no concrete providers ship in this part. Future providers
    // that register migrations will be auto-picked up here.
    log.debug("no pending migrations");
  },
};
