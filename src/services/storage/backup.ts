import { useRoomsStore } from "@/store/slices/roomsStore";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { useScenesStore } from "@/store/slices/scenesStore";
import { useAutomationsStore } from "@/store/slices/automationsStore";
import { useSettingsStore } from "@/store/slices/settingsStore";
import { useDashboardStore } from "@/store/slices/dashboardStore";
import { useUiStore } from "@/store/slices/uiStore";

const BACKUP_VERSION = 1;

export interface Backup {
  version: number;
  createdAt: number;
  data: {
    ui: unknown;
    dashboard: unknown;
    rooms: unknown;
    devices: unknown;
    scenes: unknown;
    automations: unknown;
    settings: unknown;
  };
}

export function exportBackup(): Backup {
  return {
    version: BACKUP_VERSION,
    createdAt: Date.now(),
    data: {
      ui: useUiStore.getState(),
      dashboard: useDashboardStore.getState(),
      rooms: useRoomsStore.getState().rooms,
      devices: useDevicesStore.getState().devices,
      scenes: useScenesStore.getState().scenes,
      automations: useAutomationsStore.getState().automations,
      settings: useSettingsStore.getState(),
    },
  };
}

export function importBackup(_backup: Backup): void {
  // Contract only — real merge/validate logic added when persistence
  // format is finalized.
  throw new Error("importBackup is not implemented yet in this scaffold.");
}

export function downloadBackupFile(backup: Backup): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `smarthome-backup-${new Date(backup.createdAt)
    .toISOString()
    .slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
