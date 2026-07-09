import type { Profile } from "@/models/profile";
import type { Role } from "@/models/role";
import type { User } from "@/models/user";
import type { UserPreferences } from "@/models/userPreferences";
import type { PermissionGrant } from "@/models/permission";
import { useUsersStore } from "@/store/slices/usersStore";
import { useProfilesStore } from "@/store/slices/profilesStore";
import { useRolesStore } from "@/store/slices/rolesStore";
import { usePermissionsStore } from "@/store/slices/permissionsStore";
import { useUserPreferencesStore } from "@/store/slices/userPreferencesStore";

export const USERS_SCHEMA_VERSION = 1;

export interface UsersExport {
  schemaVersion: number;
  exportedAt: number;
  users: User[];
  profiles: Profile[];
  customRoles: Role[];
  permissionOverrides: Record<string, PermissionGrant[]>;
  preferences: Record<string, UserPreferences>;
}

export function exportUsers(): UsersExport {
  return {
    schemaVersion: USERS_SCHEMA_VERSION,
    exportedAt: Date.now(),
    users: useUsersStore.getState().users,
    profiles: useProfilesStore.getState().profiles,
    customRoles: useRolesStore.getState().customRoles,
    permissionOverrides: usePermissionsStore.getState().overrides,
    preferences: useUserPreferencesStore.getState().byUserId,
  };
}

export type UsersImportStrategy = "merge" | "replace";

export function importUsers(
  data: UsersExport,
  strategy: UsersImportStrategy = "merge",
): void {
  if (!data || data.schemaVersion == null) return;
  if (strategy === "replace") {
    useUsersStore.getState().setUsers(data.users ?? []);
    useProfilesStore.getState().setAll(data.profiles ?? []);
    useRolesStore.getState().setAll(data.customRoles ?? []);
    usePermissionsStore.getState().setAll(data.permissionOverrides ?? {});
    useUserPreferencesStore.getState().setAll(data.preferences ?? {});
    return;
  }
  // Merge: upsert each item.
  const usersStore = useUsersStore.getState();
  for (const u of data.users ?? []) usersStore.upsertUser(u);
  const profileStore = useProfilesStore.getState();
  for (const p of data.profiles ?? []) profileStore.upsert(p);
  const roleStore = useRolesStore.getState();
  for (const r of data.customRoles ?? []) roleStore.upsert(r);
  const permStore = usePermissionsStore.getState();
  for (const [uid, grants] of Object.entries(data.permissionOverrides ?? {})) {
    permStore.setOverrides(uid, grants);
  }
  const prefStore = useUserPreferencesStore.getState();
  for (const [uid, prefs] of Object.entries(data.preferences ?? {})) {
    prefStore.update(uid, prefs);
  }
}
