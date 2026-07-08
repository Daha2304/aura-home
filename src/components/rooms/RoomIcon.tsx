import type { RoomType } from "@/models/room";
import {
  Sofa,
  UtensilsCrossed,
  Utensils,
  Bed,
  Baby,
  Bath,
  Laptop,
  DoorClosed,
  Trees,
  Car,
  Boxes,
  House,
  Sparkles,
  Sun,
  Flower2,
  WashingMachine,
  Cpu,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const map: Record<RoomType, LucideIcon> = {
  living: Sofa,
  kitchen: UtensilsCrossed,
  dining: Utensils,
  bedroom: Bed,
  kids: Baby,
  bathroom: Bath,
  wc: Bath,
  hallway: DoorClosed,
  stairway: DoorClosed,
  office: Laptop,
  garage: Car,
  garden: Trees,
  terrace: Sun,
  balcony: Flower2,
  basement: Boxes,
  attic: House,
  laundry: WashingMachine,
  technical: Cpu,
  outdoor: Trees,
  other: Sparkles,
  custom: Sparkles,
};

export function RoomIcon({
  type,
  className,
}: {
  type: RoomType;
  className?: string;
}) {
  const Icon = map[type] ?? Sparkles;
  return <Icon className={className} />;
}
