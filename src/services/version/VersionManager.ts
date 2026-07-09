/**
 * VersionManager — persists app / data / cache / backup / schema versions.
 * Purely local, no cloud, no server calls.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistentStorage } from "@/store/slices/_persistStorage";

export const APP_VERSION =
  (import.meta.env.VITE_APP_VERSION as string | undefined) ?? "0.14.0";
export const DATA_MODEL_VERSION = 1;
export const CACHE_VERSION = 1;
export const BACKUP_VERSION = 1;

interface VersionState {
  appVersion: string;
  dataModelVersion: number;
  cacheVersion: number;
  backupVersion: number;
  schemaVersions: Record<string, number>;
  buildHash: string | null;
  installedAt: number | null;
  setSchemaVersion: (providerId: string, version: number) => void;
  setBuildHash: (hash: string | null) => void;
  markInstalled: () => void;
}

export const useVersionStore = create<VersionState>()(
  persist(
    (set) => ({
      appVersion: APP_VERSION,
      dataModelVersion: DATA_MODEL_VERSION,
      cacheVersion: CACHE_VERSION,
      backupVersion: BACKUP_VERSION,
      schemaVersions: {},
      buildHash: null,
      installedAt: null,
      setSchemaVersion: (providerId, version) =>
        set((s) => ({ schemaVersions: { ...s.schemaVersions, [providerId]: version } })),
      setBuildHash: (buildHash) => set({ buildHash }),
      markInstalled: () => set((s) => ({ installedAt: s.installedAt ?? Date.now() })),
    }),
    { name: "smarthome.version", storage: persistentStorage() },
  ),
);

export const versionManager = {
  hydrate(): void {
    useVersionStore.getState().markInstalled();
    // Keep app version in sync with current build.
    useVersionStore.setState({ appVersion: APP_VERSION });
  },
  getAppVersion(): string { return APP_VERSION; },
  getSchemaVersion(id: string): number {
    return useVersionStore.getState().schemaVersions[id] ?? 0;
  },
  setSchemaVersion(id: string, version: number): void {
    useVersionStore.getState().setSchemaVersion(id, version);
  },
};
