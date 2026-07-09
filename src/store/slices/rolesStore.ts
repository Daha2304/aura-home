import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistentStorage } from "./_persistStorage";
import type { Role } from "@/models/role";
import type { ID } from "@/models/common";

interface RolesState {
  /** Custom roles only. Built-ins live in RoleRegistry. */
  customRoles: Role[];
  byId: Record<string, Role>;
  upsert: (r: Role) => void;
  remove: (id: ID) => void;
  setAll: (list: Role[]) => void;
}

function reindex(list: Role[]) {
  const m: Record<string, Role> = {};
  for (const r of list) m[r.id] = r;
  return m;
}

export const useRolesStore = create<RolesState>()(
  persist(
    (set, get) => ({
      customRoles: [],
      byId: {},
      upsert: (r) => {
        const list = [...get().customRoles];
        const i = list.findIndex((x) => x.id === r.id);
        if (i < 0) list.push(r);
        else list[i] = r;
        set({ customRoles: list, byId: reindex(list) });
      },
      remove: (id) => {
        const list = get().customRoles.filter((r) => r.id !== id);
        set({ customRoles: list, byId: reindex(list) });
      },
      setAll: (list) => set({ customRoles: list, byId: reindex(list) }),
    }),
    { name: "smarthome.roles", storage: persistentStorage(), version: 1 },
  ),
);
