/**
 * Users, Profiles, Roles & Permissions (Teil 12).
 *
 * Public entry point for the user subsystem. Bootstrap wires built-in
 * roles/profiles/ownership sources into their registries; managers are
 * thin facades over the corresponding stores.
 */

export { userManager, UserManager } from "./UserManager";
export { profileManager, ProfileManager } from "./ProfileManager";
export {
  userPreferencesManager,
  UserPreferencesManager,
} from "./UserPreferencesManager";
export {
  roleRegistry,
  registerBuiltinRoles,
  BUILTIN_ROLES,
} from "./RoleRegistry";
export type { RoleDescriptor } from "./RoleRegistry";
export {
  profileRegistry,
  registerBuiltinProfiles,
  BUILTIN_PROFILES,
} from "./ProfileRegistry";
export {
  permissionRegistry,
  can,
  registerBuiltinPermissionResources,
} from "./PermissionRegistry";
export type { PermissionResourceDescriptor } from "./PermissionRegistry";
export { ownershipRegistry } from "./OwnershipRegistry";
export type { OwnershipSourceDescriptor } from "./OwnershipRegistry";
export { registerBuiltinOwnershipSources } from "./ownershipSources";
export { resolveRolesForUser } from "./resolveRoles";
export {
  exportUsers,
  importUsers,
  USERS_SCHEMA_VERSION,
} from "./serialization";
export type { UsersExport, UsersImportStrategy } from "./serialization";

import { registerBuiltinRoles } from "./RoleRegistry";
import { registerBuiltinProfiles } from "./ProfileRegistry";
import { registerBuiltinPermissionResources } from "./PermissionRegistry";
import { registerBuiltinOwnershipSources } from "./ownershipSources";
import { userManager } from "./UserManager";
import { useUsersStore } from "@/store/slices/usersStore";

let bootstrapped = false;

export function bootstrapUsers(): void {
  if (bootstrapped) return;
  bootstrapped = true;
  registerBuiltinRoles();
  registerBuiltinProfiles();
  registerBuiltinPermissionResources();
  registerBuiltinOwnershipSources();

  // Ensure a default admin exists (empty session — no legacy users).
  const state = useUsersStore.getState();
  if (state.users.length === 0) {
    const admin = userManager.create({
      name: "Administrator",
      firstName: "Admin",
      isAdmin: true,
      profileId: "profile.admin",
      roleIds: ["role.admin"],
      icon: "shield",
      color: "#ef4444",
    });
    useUsersStore.getState().setCurrentUser(admin.id);
  } else if (!state.currentUserId) {
    useUsersStore.getState().setCurrentUser(state.users[0].id);
  }
}
