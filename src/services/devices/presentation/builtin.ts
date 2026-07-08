import type { Device } from "@/models/device";
import { deviceRegistry } from "@/services/registry/DeviceRegistry";
import { devicePresentationRegistry } from "./DevicePresentationRegistry";

/**
 * Registriert die eingebauten Presenter. Sie liefern nur Akzentfarben und
 * präsentationsspezifische Tags — die Detail-Sections/-Slots bleiben leer,
 * weil Teil 6B ausdrücklich KEINE Gerätesteuerung enthält.
 */
export function registerBuiltinDevicePresenters(): void {
  const registerCategory = (
    category:
      | "lighting"
      | "covers"
      | "openings"
      | "sensors"
      | "climate"
      | "media"
      | "security"
      | "energy"
      | "appliance"
      | "other",
    accent: string,
  ) => {
    devicePresentationRegistry.register({
      id: `category.${category}`,
      match: { category },
      accent,
      presentationTags: () => [],
    });
  };

  registerCategory("lighting", "#F5C518");
  registerCategory("covers", "#7C5CFF");
  registerCategory("openings", "#38BDF8");
  registerCategory("sensors", "#22C55E");
  registerCategory("climate", "#F97316");
  registerCategory("media", "#EC4899");
  registerCategory("security", "#EF4444");
  registerCategory("energy", "#10B981");
  registerCategory("appliance", "#94A3B8");
  registerCategory("other", "#64748B");

  // RGB-Licht bekommt einen eigenen Type-Presenter mit farbigem Akzent.
  devicePresentationRegistry.register({
    id: "type.rgb",
    match: { type: "rgb" },
    accent: "#7C5CFF",
    presentationTags: (ctx: { device: Device }) => {
      const flags = ctx.device.capabilityFlags ?? deviceRegistry.getCapabilities(ctx.device.type);
      return flags.includes("supportsRGB") ? ["Farbe"] : [];
    },
  });

  devicePresentationRegistry.registerFallback({
    id: "fallback.generic",
    match: {},
    accent: "#64748B",
    presentationTags: () => [],
  });
}
