import type { ID } from "./common";

export type DashboardId = ID;

export type DashboardVisibility = "visible" | "hidden" | "archived";

export interface DashboardBackground {
  kind: "none" | "color" | "gradient" | "image" | "blur";
  value?: string; // color hex, gradient CSS, image URL
  opacity?: number; // 0..1
  blur?: number; // px
}

export type DashboardTag = string;

export interface DashboardMeta {
  createdAt: number;
  updatedAt: number;
  schemaVersion: number;
}

export interface Dashboard {
  id: DashboardId;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  background?: DashboardBackground;
  order: number;
  favorite: boolean;
  visibility: DashboardVisibility;
  tags: DashboardTag[];
  widgetInstanceIds: string[]; // Reihenfolge = Default-Sortierung
  meta: DashboardMeta;
  custom?: Record<string, unknown>;
}

export function createDashboard(input: Partial<Dashboard> & { name: string; id: string }): Dashboard {
  const now = Date.now();
  return {
    id: input.id,
    name: input.name,
    description: input.description,
    icon: input.icon,
    color: input.color,
    background: input.background ?? { kind: "none" },
    order: input.order ?? 0,
    favorite: input.favorite ?? false,
    visibility: input.visibility ?? "visible",
    tags: input.tags ?? [],
    widgetInstanceIds: input.widgetInstanceIds ?? [],
    meta: input.meta ?? { createdAt: now, updatedAt: now, schemaVersion: 1 },
    custom: input.custom,
  };
}
