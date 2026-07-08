import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createId } from "@/utils/ids";
import type { ServerConfig } from "@/models/server";
import { createServerConfig } from "@/models/server";

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
  duplicateServer: (id: string) => ServerConfig | undefined;
  toggleFavorite: (id: string) => void;
  markServerConnected: (id: string) => void;
  replaceServers: (servers: ServerConfig[], mode: "merge" | "replace") => void;
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
        set({
          servers: get().servers.map((x) =>
            x.id === s.id ? { ...s, updatedAt: Date.now() } : x,
          ),
        }),
      removeServer: (id) =>
        set((state) => ({
          servers: state.servers.filter((s) => s.id !== id),
          activeServerId:
            state.activeServerId === id ? undefined : state.activeServerId,
        })),
      duplicateServer: (id) => {
        const src = get().servers.find((s) => s.id === id);
        if (!src) return undefined;
        const copy = createServerConfig({
          ...src,
          id: createId("srv"),
          name: `${src.name} (Kopie)`,
          favorite: false,
          active: false,
          lastConnectedAt: undefined,
          createdAt: Date.now(),
        });
        set((state) => ({ servers: [...state.servers, copy] }));
        return copy;
      },
      toggleFavorite: (id) =>
        set({
          servers: get().servers.map((s) =>
            s.id === id ? { ...s, favorite: !s.favorite, updatedAt: Date.now() } : s,
          ),
        }),
      markServerConnected: (id) =>
        set({
          servers: get().servers.map((s) =>
            s.id === id
              ? { ...s, lastConnectedAt: Date.now(), updatedAt: Date.now() }
              : s,
          ),
        }),
      replaceServers: (incoming, mode) => {
        if (mode === "replace") {
          set({ servers: incoming, activeServerId: incoming[0]?.id });
          return;
        }
        const byId = new Map(get().servers.map((s) => [s.id, s]));
        for (const s of incoming) {
          const existing = byId.get(s.id);
          byId.set(s.id, existing ? { ...existing, ...s, updatedAt: Date.now() } : s);
        }
        set({ servers: Array.from(byId.values()) });
      },
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
