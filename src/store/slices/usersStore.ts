import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistentStorage } from "./_persistStorage";
import type { FavoriteRef, User, UserRole } from "@/models/user";
import type { ID } from "@/models/common";

interface UsersState {
  users: User[];
  byId: Record<string, User>;
  currentUserId?: ID;

  // Legacy API (kept for backwards compatibility).
  setUsers: (u: User[]) => void;
  addUser: (u: User) => void;
  removeUser: (id: ID) => void;
  setCurrentUser: (id: ID | undefined) => void;
  currentUser: () => User | undefined;

  // New API (Teil 12).
  upsertUser: (u: User) => void;
  updateUser: (id: ID, patch: Partial<User>) => void;
  setActive: (id: ID, active: boolean) => void;
  assignRole: (id: ID, roleIds: ID[]) => void;
  assignProfile: (id: ID, profileId: ID | undefined) => void;
  addFavorite: (id: ID, ref: FavoriteRef) => void;
  removeFavorite: (id: ID, refType: FavoriteRef["refType"], refId: ID) => void;
}

function reindex(users: User[]): Record<string, User> {
  const map: Record<string, User> = {};
  for (const u of users) map[u.id] = u;
  return map;
}

/** Migrate legacy user records (`role: "admin"` only) to `roleIds`. */
function migrate(u: User): User {
  if (Array.isArray(u.roleIds) && u.roleIds.length > 0) return u;
  const roleKey = (u.role ?? "user") as UserRole;
  const roleId =
    roleKey === "admin"
      ? "role.admin"
      : roleKey === "guest"
        ? "role.guest"
        : roleKey === "technician"
          ? "role.technician"
          : "role.user";
  return {
    ...u,
    active: u.active ?? true,
    isAdmin: u.isAdmin ?? roleKey === "admin",
    isGuest: u.isGuest ?? roleKey === "guest",
    roleIds: [roleId],
  };
}

export const useUsersStore = create<UsersState>()(
  persist(
    (set, get) => ({
      users: [],
      byId: {},
      currentUserId: undefined,

      setUsers: (users) => {
        const migrated = users.map(migrate);
        set({ users: migrated, byId: reindex(migrated) });
      },
      addUser: (u) => {
        const migrated = migrate(u);
        const users = [...get().users, migrated];
        set({ users, byId: reindex(users) });
      },
      removeUser: (id) => {
        const users = get().users.filter((u) => u.id !== id);
        set({ users, byId: reindex(users) });
      },
      setCurrentUser: (id) => set({ currentUserId: id }),
      currentUser: () => {
        const s = get();
        return s.currentUserId ? s.byId[s.currentUserId] : undefined;
      },

      upsertUser: (u) => {
        const migrated = migrate(u);
        const existing = get().users;
        const idx = existing.findIndex((x) => x.id === migrated.id);
        const users =
          idx < 0
            ? [...existing, migrated]
            : existing.map((x, i) => (i === idx ? migrated : x));
        set({ users, byId: reindex(users) });
      },
      updateUser: (id, patch) => {
        const now = Date.now();
        const users = get().users.map((u) =>
          u.id === id ? migrate({ ...u, ...patch, updatedAt: now }) : u,
        );
        set({ users, byId: reindex(users) });
      },
      setActive: (id, active) => get().updateUser(id, { active }),
      assignRole: (id, roleIds) => get().updateUser(id, { roleIds }),
      assignProfile: (id, profileId) => get().updateUser(id, { profileId }),
      addFavorite: (id, ref) => {
        const u = get().byId[id];
        if (!u) return;
        const favorites = [
          ...(u.favorites ?? []).filter(
            (f) => !(f.refType === ref.refType && f.refId === ref.refId),
          ),
          { ...ref, addedAt: ref.addedAt ?? Date.now() },
        ];
        get().updateUser(id, { favorites });
      },
      removeFavorite: (id, refType, refId) => {
        const u = get().byId[id];
        if (!u) return;
        const favorites = (u.favorites ?? []).filter(
          (f) => !(f.refType === refType && f.refId === refId),
        );
        get().updateUser(id, { favorites });
      },
    }),
    {
      name: "smarthome.users",
      storage: persistentStorage(),
      version: 2,
      migrate: (persisted, _ver) => {
        const state = persisted as UsersState;
        if (state && Array.isArray(state.users)) {
          const migrated = state.users.map(migrate);
          state.users = migrated;
          state.byId = reindex(migrated);
        }
        return state;
      },
    },
  ),
);

// ============ Selectors (memoized-friendly, pure) ==================

export const selectAllUsers = (s: UsersState) => s.users;
export const selectUserById = (id: ID) => (s: UsersState) => s.byId[id];
export const selectCurrentUser = (s: UsersState) =>
  s.currentUserId ? s.byId[s.currentUserId] : undefined;
export const selectActiveUsers = (s: UsersState) =>
  s.users.filter((u) => u.active !== false);
export const selectAdmins = (s: UsersState) =>
  s.users.filter((u) => u.isAdmin);
export const selectGuests = (s: UsersState) =>
  s.users.filter((u) => u.isGuest);
export const selectByRoleId = (roleId: ID) => (s: UsersState) =>
  s.users.filter((u) => u.roleIds?.includes(roleId));
export const selectFavoritesOf = (id: ID) => (s: UsersState) =>
  s.byId[id]?.favorites ?? [];
