/**
 * Generic permission registry. Each resource type gets a descriptor
 * that lists supported actions and how to evaluate them for a given user.
 * The evaluator is a pure function — no switch cascades — extension happens
 * exclusively via registerResource(descriptor).
 */
import type { ID } from "@/models/common";
import type {
  PermissionAction,
  PermissionGrant,
  PermissionResource,
  PermissionScope,
} from "@/models/permission";
import type { Role } from "@/models/role";
import type { User } from "@/models/user";
import { ownershipRegistry } from "./OwnershipRegistry";

export interface PermissionResourceDescriptor {
  resource: PermissionResource;
  actions: PermissionAction[];
  /** Maps this resource -> ownership refType (if any). */
  ownershipRefType?: "device" | "room" | "scene" | "group" | "automation";
}

export class PermissionRegistry {
  private readonly resources = new Map<PermissionResource, PermissionResourceDescriptor>();

  registerResource(desc: PermissionResourceDescriptor): void {
    this.resources.set(desc.resource, desc);
  }
  get(res: PermissionResource): PermissionResourceDescriptor | undefined {
    return this.resources.get(res);
  }
  list(): PermissionResourceDescriptor[] {
    return [...this.resources.values()];
  }
}

export const permissionRegistry = new PermissionRegistry();

const ACTION_RANK: Record<PermissionAction, number> = {
  read: 1,
  control: 2,
  edit: 3,
  delete: 4,
  manage: 5,
};

function grantCovers(grant: PermissionGrant, action: PermissionAction): boolean {
  // "manage" covers all lower actions.
  return ACTION_RANK[grant.action] >= ACTION_RANK[action];
}

function scopeMatches(
  scope: PermissionScope | undefined,
  user: User,
  desc: PermissionResourceDescriptor | undefined,
  refId: ID | undefined,
): boolean {
  if (!scope || scope === "all") return true;
  if (!refId || !desc?.ownershipRefType) return false;
  const ownership = ownershipRegistry.read(desc.ownershipRefType, refId);
  if (!ownership) return false;
  if (scope === "own") return ownership.ownerUserId === user.id;
  if (scope === "shared") {
    return (
      ownership.ownerUserId === user.id ||
      (ownership.memberUserIds?.includes(user.id) ?? false) ||
      (ownership.guestUserIds?.includes(user.id) ?? false) ||
      (ownership.editorUserIds?.includes(user.id) ?? false)
    );
  }
  if (typeof scope === "object" && "refIds" in scope) {
    return scope.refIds.includes(refId);
  }
  return false;
}

/**
 * Pure permission check. Admin users pass unconditionally.
 *
 * Note: Teil-12 permissions are UI-informative — this function is used to
 * hide/gray-out UI elements. There is no runtime block in the command path.
 */
export function can(
  user: User | undefined,
  roles: Role[],
  action: PermissionAction,
  resource: PermissionResource,
  refId?: ID,
): boolean {
  if (!user) return false;
  if (user.isAdmin) return true;
  const desc = permissionRegistry.get(resource);
  for (const role of roles) {
    for (const grant of role.permissions) {
      if (grant.resource !== resource) continue;
      if (!grantCovers(grant, action)) continue;
      if (scopeMatches(grant.scope, user, desc, refId)) return true;
    }
  }
  return false;
}

/** Registers the default resource descriptors mirroring PERMISSION_RESOURCES. */
export function registerBuiltinPermissionResources(): void {
  const map: Record<PermissionResource, PermissionResourceDescriptor["ownershipRefType"] | undefined> = {
    device: "device",
    room: "room",
    scene: "scene",
    group: "group",
    automation: "automation",
    dashboard: undefined,
    widget: undefined,
    notification: undefined,
    timeline: undefined,
    analytics: undefined,
    history: undefined,
    settings: undefined,
    user: undefined,
  };
  for (const resource of Object.keys(map) as PermissionResource[]) {
    permissionRegistry.registerResource({
      resource,
      actions: ["read", "control", "edit", "delete", "manage"],
      ownershipRefType: map[resource],
    });
  }
}
