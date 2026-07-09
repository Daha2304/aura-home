/**
 * Gemeinsames Event-Kategorien-Modell (Teil 10).
 *
 * Wird später vom Event Center, der Timeline und den Benachrichtigungen
 * gemeinsam verwendet. Hier ausschließlich als Datenmodell.
 */

export type EventCategory =
  | "system"
  | "device"
  | "room"
  | "scene"
  | "automation"
  | "group"
  | "security"
  | "energy"
  | "network"
  | "user"
  | "custom";

export const EVENT_CATEGORIES: readonly EventCategory[] = [
  "system",
  "device",
  "room",
  "scene",
  "automation",
  "group",
  "security",
  "energy",
  "network",
  "user",
  "custom",
] as const;

export interface EventCategoryDescriptor {
  category: EventCategory;
  label: string;
  icon: string;
  color: string;
}

export const DEFAULT_EVENT_CATEGORY_DESCRIPTORS: Record<
  EventCategory,
  EventCategoryDescriptor
> = {
  system:     { category: "system",     label: "System",     icon: "cpu",         color: "muted" },
  device:     { category: "device",     label: "Gerät",      icon: "plug",        color: "accent" },
  room:       { category: "room",       label: "Raum",       icon: "layout-grid", color: "accent" },
  scene:      { category: "scene",      label: "Szene",      icon: "sparkles",    color: "accent" },
  automation: { category: "automation", label: "Automation", icon: "workflow",    color: "accent" },
  group:      { category: "group",      label: "Gruppe",     icon: "layers",      color: "accent" },
  security:   { category: "security",   label: "Sicherheit", icon: "shield",      color: "warning" },
  energy:     { category: "energy",     label: "Energie",    icon: "zap",         color: "warning" },
  network:    { category: "network",    label: "Netzwerk",   icon: "wifi",        color: "muted" },
  user:       { category: "user",       label: "Benutzer",   icon: "user",        color: "muted" },
  custom:     { category: "custom",     label: "Sonstige",   icon: "tag",         color: "muted" },
};
