import type { DeviceType } from "@/models/device";
import {
  Lightbulb,
  Palette,
  SlidersHorizontal,
  Plug,
  Activity,
  Thermometer,
  Droplets,
  Blinds,
  Flame,
  Wind,
  Fan,
  DoorOpen,
  Car,
  Tv,
  Speaker,
  Camera,
  ShieldAlert,
  CloudFog,
  Waves,
  Gauge,
  Sparkles,
  DoorClosed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const map: Partial<Record<DeviceType, LucideIcon>> = {
  light: Lightbulb,
  rgb: Palette,
  dimmer: SlidersHorizontal,
  outlet: Plug,
  sensor: Activity,
  temperature: Thermometer,
  humidity: Droplets,
  blinds: Blinds,
  heating: Flame,
  thermostat: Thermometer,
  ac: Wind,
  window: Fan,
  door: DoorOpen,
  garage: Car,
  tv: Tv,
  avr: Speaker,
  speaker: Speaker,
  camera: Camera,
  alarm: ShieldAlert,
  smoke: CloudFog,
  water: Waves,
  energy: Gauge,
  custom: Sparkles,
};

export function DeviceIcon({
  type,
  className,
}: {
  type: DeviceType;
  className?: string;
}) {
  const Icon = map[type] ?? DoorClosed;
  return <Icon className={className} />;
}
