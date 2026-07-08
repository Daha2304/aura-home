import type { HexColor, ID, IconName } from "./common";

export type RoomType =
  | "living"
  | "kitchen"
  | "bedroom"
  | "bathroom"
  | "office"
  | "hallway"
  | "outdoor"
  | "garage"
  | "basement"
  | "attic"
  | "custom";

export interface Room {
  id: ID;
  name: string;
  icon: IconName;
  color: HexColor;
  image?: string;
  floor?: number;
  order: number;
  type: RoomType;
}
