import type { RoomType } from "@/models/room";
import {
  Sofa,
  UtensilsCrossed,
  Bed,
  Bath,
  Laptop,
  DoorClosed,
  Trees,
  Car,
  Boxes,
  House,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const map: Record<RoomType, LucideIcon> = {
  living: Sofa,
  kitchen: UtensilsCrossed,
  bedroom: Bed,
  bathroom: Bath,
  office: Laptop,
  hallway: DoorClosed,
  outdoor: Trees,
  garage: Car,
  basement: Boxes,
  attic: House,
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
