import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ServerConfig } from "@/models/server";

interface NotificationSettings {
  enabled: boolean;
  deviceOffline: boolean;
  automationTriggered: boolean;
  securityAlerts: boolean;
}

interface SettingsState {
  servers: ServerConfig[];
  activeServerId?: string;
  developerMode: boolean;
  notifications: NotificationSettings;
  addServer: (s: ServerConfig) => void;
  updateServer: (s: ServerConfig) => void;
  removeServer: (id: string) => void;
  setActiveServer: (id: string | undefined) => void;
  setDeveloperMode: (v: boolean) => void;
  setNotifications: (n: Partial<NotificationSettings>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      servers: [],
      activeServerId: undefined,
      developerMode: false,
      notifications: {
        enabled: true,
        deviceOffline: true,
        automationTriggered: false,
        securityAlerts: true,
      },
      addServer: (s) => set({ servers: [...get().servers, s] }),
      updateServer: (s) =>
        set({
          servers: get().servers.map((x) => (x.id === s.id ? s : x)),
        }),
      removeServer: (id) =>
        set({ servers: get().servers.filter((s) => s.id !== id) }),
      setActiveServer: (id) => set({ activeServerId: id }),
      setDeveloperMode: (developerMode) => set({ developerMode }),
      setNotifications: (n) =>
        set({ notifications: { ...get().notifications, ...n } }),
    }),
    {
      name: "smarthome.settings",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
