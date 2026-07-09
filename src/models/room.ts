import type { HexColor, ID, IconName } from "./common";

export type RoomType =
  | "living"
  | "kitchen"
  | "dining"
  | "bedroom"
  | "kids"
  | "bathroom"
  | "wc"
  | "hallway"
  | "stairway"
  | "office"
  | "garage"
  | "garden"
  | "terrace"
  | "balcony"
  | "basement"
  | "attic"
  | "laundry"
  | "technical"
  | "outdoor"
  | "other"
  | "custom";

export type RoomStatus = "active" | "inactive" | "maintenance" | "hidden";

export interface Room {
  id: ID;
  name: string;
  icon: IconName;
  color: HexColor;
  image?: string;
  floor?: number;
  order: number;
  type: RoomType;
  /** Optional erweiterte Felder (rückwärtskompatibel). */
  description?: string;
  category?: RoomType;
  favorite?: boolean;
  tags?: string[];
  status?: RoomStatus;
  customProps?: Record<string, unknown>;
  createdAt?: number;
  updatedAt?: number;
  /** User binding (Teil 12). All optional — legacy rooms remain valid. */
  ownerUserId?: ID;
  memberUserIds?: ID[];
  guestUserIds?: ID[];
}
