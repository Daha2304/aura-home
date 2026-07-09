import { roleRegistry } from "./RoleRegistry";
import { useRolesStore } from "@/store/slices/rolesStore";
import { usePermissionsStore } from "@/store/slices/permissionsStore";
import type { Role } from "@/models/role";
import type { User } from "@/models/user";

/**
 * Combines built-in role descriptors (via RoleRegistry) with persisted
 * custom roles and per-user permission overrides.
 */
export function resolveRolesForUser(user: User | undefined): Role[] {
  if (!user) return [];
  const roles: Role[] = [];
  const custom = useRolesStore.getState().byId;
  for (const id of user.roleIds ?? []) {
    const desc = roleRegistry.get(id);
    if (desc) {
      roles.push(roleRegistry.toRole(desc));
      continue;
    }
    const c = custom[id];
    if (c) roles.push(c);
  }
  const overrides = usePermissionsStore.getState().overrides[user.id];
  if (overrides && overrides.length > 0) {
    roles.push({
      id: `overrides:${user.id}`,
      key: "overrides",
      name: "Overrides",
      builtin: false,
      permissions: overrides,
    });
  }
  return roles;
}
