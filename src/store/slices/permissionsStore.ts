import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistentStorage } from "./_persistStorage";
import type { PermissionGrant } from "@/models/permission";
import type { ID } from "@/models/common";

/**
 * Per-user permission overrides on top of the roles-derived grants.
 * Empty by default — grants come from user's roles.
 */
interface PermissionsState {
  overrides: Record<ID, PermissionGrant[]>; // userId -> extra grants
  setOverrides: (userId: ID, grants: PermissionGrant[]) => void;
  clear: (userId: ID) => void;
  setAll: (map: Record<ID, PermissionGrant[]>) => void;
}

export const usePermissionsStore = create<PermissionsState>()(
  persist(
    (set, get) => ({
      overrides: {},
      setOverrides: (userId, grants) =>
        set({ overrides: { ...get().overrides, [userId]: grants } }),
      clear: (userId) => {
        const next = { ...get().overrides };
        delete next[userId];
        set({ overrides: next });
      },
      setAll: (map) => set({ overrides: map }),
    }),
    { name: "smarthome.permissions", storage: persistentStorage(), version: 1 },
  ),
);
