import type { RoomType } from "./room";

export interface RoomCategoryMeta {
  type: RoomType;
  label: string;
  icon: string;
  accent: string; // hex color
  sortGroup: number;
}

export const ROOM_CATEGORIES: RoomCategoryMeta[] = [
  { type: "living", label: "Wohnzimmer", icon: "sofa", accent: "#f59e0b", sortGroup: 1 },
  { type: "kitchen", label: "Küche", icon: "utensils-crossed", accent: "#f97316", sortGroup: 1 },
  { type: "dining", label: "Esszimmer", icon: "utensils", accent: "#eab308", sortGroup: 1 },
  { type: "bedroom", label: "Schlafzimmer", icon: "bed", accent: "#8b5cf6", sortGroup: 2 },
  { type: "kids", label: "Kinderzimmer", icon: "baby", accent: "#ec4899", sortGroup: 2 },
  { type: "bathroom", label: "Badezimmer", icon: "bath", accent: "#06b6d4", sortGroup: 3 },
  { type: "wc", label: "WC", icon: "toilet", accent: "#0ea5e9", sortGroup: 3 },
  { type: "hallway", label: "Flur", icon: "door-closed", accent: "#94a3b8", sortGroup: 4 },
  { type: "stairway", label: "Treppenhaus", icon: "stairs", accent: "#a3a3a3", sortGroup: 4 },
  { type: "office", label: "Büro", icon: "laptop", accent: "#3b82f6", sortGroup: 5 },
  { type: "garage", label: "Garage", icon: "car", accent: "#64748b", sortGroup: 6 },
  { type: "garden", label: "Garten", icon: "trees", accent: "#22c55e", sortGroup: 7 },
  { type: "terrace", label: "Terrasse", icon: "sun", accent: "#84cc16", sortGroup: 7 },
  { type: "balcony", label: "Balkon", icon: "flower-2", accent: "#10b981", sortGroup: 7 },
  { type: "basement", label: "Keller", icon: "boxes", accent: "#6b7280", sortGroup: 8 },
  { type: "attic", label: "Dachboden", icon: "house", accent: "#78716c", sortGroup: 8 },
  { type: "laundry", label: "Hauswirtschaft", icon: "washing-machine", accent: "#14b8a6", sortGroup: 9 },
  { type: "technical", label: "Technikraum", icon: "cpu", accent: "#0891b2", sortGroup: 9 },
  { type: "outdoor", label: "Außenbereich", icon: "trees", accent: "#22c55e", sortGroup: 7 },
  { type: "other", label: "Sonstiges", icon: "sparkles", accent: "#a855f7", sortGroup: 10 },
  { type: "custom", label: "Benutzerdefiniert", icon: "sparkles", accent: "#a855f7", sortGroup: 10 },
];

export const ROOM_CATEGORY_BY_TYPE: Record<RoomType, RoomCategoryMeta> = ROOM_CATEGORIES.reduce(
  (acc, c) => {
    acc[c.type] = c;
    return acc;
  },
  {} as Record<RoomType, RoomCategoryMeta>,
);

export function getRoomCategoryMeta(type: RoomType): RoomCategoryMeta {
  return ROOM_CATEGORY_BY_TYPE[type] ?? ROOM_CATEGORY_BY_TYPE.custom;
}
