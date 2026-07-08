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
  debugWebSocket: boolean;
  notifications: NotificationSettings;

  addServer: (s: ServerConfig) => void;
  updateServer: (s: ServerConfig) => void;
  removeServer: (id: string) => void;
  setActiveServer: (id: string | undefined) => void;
  setDeveloperMode: (v: boolean) => void;
  setDebugWebSocket: (v: boolean) => void;
  setNotifications: (n: Partial<NotificationSettings>) => void;

  activeServer: () => ServerConfig | undefined;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      servers: [],
      activeServerId: undefined,
      developerMode: false,
      debugWebSocket: false,
      notifications: {
        enabled: true,
        deviceOffline: true,
        automationTriggered: false,
        securityAlerts: true,
      },
      addServer: (s) =>
        set((state) => ({
          servers: [...state.servers, s],
          activeServerId: state.activeServerId ?? s.id,
        })),
      updateServer: (s) =>
        set({ servers: get().servers.map((x) => (x.id === s.id ? s : x)) }),
      removeServer: (id) =>
        set((state) => ({
          servers: state.servers.filter((s) => s.id !== id),
          activeServerId:
            state.activeServerId === id ? undefined : state.activeServerId,
        })),
      setActiveServer: (id) => set({ activeServerId: id }),
      setDeveloperMode: (developerMode) => set({ developerMode }),
      setDebugWebSocket: (debugWebSocket) => set({ debugWebSocket }),
      setNotifications: (n) =>
        set({ notifications: { ...get().notifications, ...n } }),
      activeServer: () =>
        get().servers.find((s) => s.id === get().activeServerId),
    }),
    {
      name: "smarthome.settings",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
