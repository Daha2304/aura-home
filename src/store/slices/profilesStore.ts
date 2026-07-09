import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistentStorage } from "./_persistStorage";
import type { Profile } from "@/models/profile";
import type { ID } from "@/models/common";

interface ProfilesState {
  profiles: Profile[];
  byId: Record<string, Profile>;
  upsert: (p: Profile) => void;
  remove: (id: ID) => void;
  setAll: (list: Profile[]) => void;
}

function reindex(list: Profile[]) {
  const m: Record<string, Profile> = {};
  for (const p of list) m[p.id] = p;
  return m;
}

export const useProfilesStore = create<ProfilesState>()(
  persist(
    (set, get) => ({
      profiles: [],
      byId: {},
      upsert: (p) => {
        const list = [...get().profiles];
        const i = list.findIndex((x) => x.id === p.id);
        if (i < 0) list.push(p);
        else list[i] = p;
        set({ profiles: list, byId: reindex(list) });
      },
      remove: (id) => {
        const list = get().profiles.filter((p) => p.id !== id);
        set({ profiles: list, byId: reindex(list) });
      },
      setAll: (list) => set({ profiles: list, byId: reindex(list) }),
    }),
    { name: "smarthome.profiles", storage: persistentStorage(), version: 1 },
  ),
);

export const selectAllProfiles = (s: ProfilesState) => s.profiles;
export const selectProfileById = (id: ID) => (s: ProfilesState) => s.byId[id];
