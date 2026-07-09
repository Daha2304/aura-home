/**
 * Registry of built-in and custom roles.
 * Built-in role descriptors are the sole source of hardcoded roles;
 * custom roles come from the rolesStore.
 */
import type { Role } from "@/models/role";
import type { PermissionGrant } from "@/models/permission";
import { TypedEmitter } from "@/services/events/EventEmitter";

export interface RoleDescriptor {
  id: string;
  key: string;
  name: string;
  description?: string;
  icon?: string;
  color?: `#${string}`;
  permissions: PermissionGrant[];
}

interface Events {
  changed: void;
}

export class RoleRegistry extends TypedEmitter<Events> {
  private readonly descriptors = new Map<string, RoleDescriptor>();

  registerRole(desc: RoleDescriptor): void {
    this.descriptors.set(desc.id, desc);
    this.emit("changed", undefined);
  }
  unregister(id: string): void {
    this.descriptors.delete(id);
    this.emit("changed", undefined);
  }
  get(id: string): RoleDescriptor | undefined {
    return this.descriptors.get(id);
  }
  getByKey(key: string): RoleDescriptor | undefined {
    for (const d of this.descriptors.values()) if (d.key === key) return d;
    return undefined;
  }
  list(): RoleDescriptor[] {
    return [...this.descriptors.values()];
  }
  toRole(desc: RoleDescriptor): Role {
    return {
      id: desc.id,
      key: desc.key,
      name: desc.name,
      description: desc.description,
      icon: desc.icon,
      color: desc.color,
      builtin: true,
      permissions: desc.permissions,
    };
  }
}

export const roleRegistry = new RoleRegistry();

/** Built-in role descriptors (Admin, User, Guest, Technician). */
export const BUILTIN_ROLES: RoleDescriptor[] = [
  {
    id: "role.admin",
    key: "admin",
    name: "Administrator",
    description: "Vollzugriff auf alle Ressourcen.",
    icon: "shield",
    color: "#ef4444",
    permissions: [
      { resource: "device", action: "manage", scope: "all" },
      { resource: "room", action: "manage", scope: "all" },
      { resource: "group", action: "manage", scope: "all" },
      { resource: "scene", action: "manage", scope: "all" },
      { resource: "automation", action: "manage", scope: "all" },
      { resource: "dashboard", action: "manage", scope: "all" },
      { resource: "widget", action: "manage", scope: "all" },
      { resource: "notification", action: "manage", scope: "all" },
      { resource: "timeline", action: "manage", scope: "all" },
      { resource: "analytics", action: "manage", scope: "all" },
      { resource: "history", action: "manage", scope: "all" },
      { resource: "settings", action: "manage", scope: "all" },
      { resource: "user", action: "manage", scope: "all" },
    ],
  },
  {
    id: "role.user",
    key: "user",
    name: "Benutzer",
    description: "Standardbenutzer mit Zugriff auf eigene und freigegebene Ressourcen.",
    icon: "user",
    color: "#3b82f6",
    permissions: [
      { resource: "device", action: "control", scope: "all" },
      { resource: "device", action: "read", scope: "all" },
      { resource: "room", action: "read", scope: "all" },
      { resource: "scene", action: "control", scope: "all" },
      { resource: "scene", action: "edit", scope: "own" },
      { resource: "group", action: "control", scope: "all" },
      { resource: "automation", action: "control", scope: "own" },
      { resource: "dashboard", action: "edit", scope: "own" },
      { resource: "notification", action: "read", scope: "own" },
      { resource: "timeline", action: "read", scope: "all" },
      { resource: "analytics", action: "read", scope: "all" },
      { resource: "history", action: "read", scope: "all" },
    ],
  },
  {
    id: "role.guest",
    key: "guest",
    name: "Gast",
    description: "Nur Lesezugriff auf ausdrücklich freigegebene Bereiche.",
    icon: "user-round",
    color: "#94a3b8",
    permissions: [
      { resource: "device", action: "read", scope: "shared" },
      { resource: "device", action: "control", scope: "shared" },
      { resource: "room", action: "read", scope: "shared" },
      { resource: "scene", action: "control", scope: "shared" },
    ],
  },
  {
    id: "role.technician",
    key: "technician",
    name: "Techniker",
    description: "Wartungszugriff auf Geräte und Automationen.",
    icon: "wrench",
    color: "#f59e0b",
    permissions: [
      { resource: "device", action: "manage", scope: "all" },
      { resource: "room", action: "read", scope: "all" },
      { resource: "automation", action: "edit", scope: "all" },
      { resource: "timeline", action: "read", scope: "all" },
      { resource: "history", action: "read", scope: "all" },
      { resource: "settings", action: "edit", scope: "all" },
    ],
  },
];

let registered = false;
export function registerBuiltinRoles(): void {
  if (registered) return;
  registered = true;
  for (const d of BUILTIN_ROLES) roleRegistry.registerRole(d);
}
