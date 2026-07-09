/**
 * Registry of built-in and custom profiles.
 */
import type { Profile } from "@/models/profile";
import { TypedEmitter } from "@/services/events/EventEmitter";

interface Events {
  changed: void;
}

export class ProfileRegistry extends TypedEmitter<Events> {
  private readonly descriptors = new Map<string, Profile>();

  registerProfile(p: Profile): void {
    this.descriptors.set(p.id, { ...p, builtin: true });
    this.emit("changed", undefined);
  }
  get(id: string): Profile | undefined {
    return this.descriptors.get(id);
  }
  list(): Profile[] {
    return [...this.descriptors.values()];
  }
}

export const profileRegistry = new ProfileRegistry();

export const BUILTIN_PROFILES: Profile[] = [
  {
    id: "profile.admin",
    name: "Administrator",
    icon: "shield",
    color: "#ef4444",
    description: "Vollzugriff, alle Dashboards, alle Benachrichtigungen.",
    builtin: true,
  },
  {
    id: "profile.family",
    name: "Familie",
    icon: "users",
    color: "#3b82f6",
    description: "Standard-Familienzugriff.",
    builtin: true,
  },
  {
    id: "profile.kids",
    name: "Kinder",
    icon: "baby",
    color: "#f59e0b",
    description: "Eingeschränkter Zugriff für Kinder.",
    builtin: true,
  },
  {
    id: "profile.guest",
    name: "Gast",
    icon: "user-round",
    color: "#94a3b8",
    description: "Nur Lesezugriff auf freigegebene Bereiche.",
    builtin: true,
  },
  {
    id: "profile.technician",
    name: "Techniker",
    icon: "wrench",
    color: "#f59e0b",
    description: "Wartungszugriff.",
    builtin: true,
  },
];

let registered = false;
export function registerBuiltinProfiles(): void {
  if (registered) return;
  registered = true;
  for (const p of BUILTIN_PROFILES) profileRegistry.registerProfile(p);
}
