import type { ID } from "@/models/common";
import type { User } from "@/models/user";
import { useUsersStore } from "@/store/slices/usersStore";
import { createId } from "@/utils/ids";

/**
 * Thin facade over `usersStore`. Encapsulates ID generation, invariants
 * (`isAdmin` mirrored to `role`) and default role assignment.
 */
export class UserManager {
  create(input: Partial<User> & { name: string }): User {
    const now = Date.now();
    const isAdmin = input.isAdmin ?? false;
    const isGuest = input.isGuest ?? false;
    const role = isAdmin ? "admin" : isGuest ? "guest" : "user";
    const roleIds =
      input.roleIds && input.roleIds.length > 0
        ? input.roleIds
        : isAdmin
          ? ["role.admin"]
          : isGuest
            ? ["role.guest"]
            : ["role.user"];
    const user: User = {
      id: input.id ?? createId("user"),
      uuid: input.uuid ?? createId("uuid"),
      name: input.name,
      firstName: input.firstName,
      lastName: input.lastName,
      avatarUrl: input.avatarUrl,
      email: input.email,
      phone: input.phone,
      description: input.description,
      color: input.color,
      icon: input.icon,
      language: input.language,
      timezone: input.timezone,
      active: input.active ?? true,
      isAdmin,
      isGuest,
      role,
      roleIds,
      profileId: input.profileId,
      favorites: input.favorites ?? [],
      custom: input.custom,
      createdAt: input.createdAt ?? now,
      updatedAt: now,
    };
    useUsersStore.getState().upsertUser(user);
    return user;
  }

  update(id: ID, patch: Partial<User>): void {
    useUsersStore.getState().updateUser(id, patch);
  }
  remove(id: ID): void {
    useUsersStore.getState().removeUser(id);
  }
  setActive(id: ID, active: boolean): void {
    useUsersStore.getState().setActive(id, active);
  }
  setCurrent(id: ID | undefined): void {
    useUsersStore.getState().setCurrentUser(id);
  }
  assignRole(id: ID, roleIds: ID[]): void {
    useUsersStore.getState().assignRole(id, roleIds);
  }
  assignProfile(id: ID, profileId: ID | undefined): void {
    useUsersStore.getState().assignProfile(id, profileId);
  }
}

export const userManager = new UserManager();
