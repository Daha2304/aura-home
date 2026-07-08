/**
 * Device Presentation Layer (Teil 6B).
 *
 * Beschreibt, WIE ein Gerät dargestellt wird. Keine Geschäftslogik,
 * keine Steuerung — nur Präsentations-Slots (Icon-Akzente, Detail-Sections).
 * Neue Gerätetypen registrieren sich hier; UI-Komponenten kennen niemals
 * konkrete Typen und enthalten keine if/else-Ketten über `device.type`.
 */
import type { ReactNode } from "react";
import type { Device } from "@/models/device";
import type { DeviceCategory } from "@/models/deviceCategory";
import type { DeviceTypeId } from "@/models/deviceType";

export interface DevicePresentationContext {
  device: Device;
}

export interface DeviceDetailSection {
  id: string;
  title: string;
  render: (ctx: DevicePresentationContext) => ReactNode;
}

/**
 * Ein Presenter beschreibt die Darstellung. Er matcht entweder einen
 * `type` oder eine `category`. Beim Auflösen gewinnt der Typ-Match,
 * dann Kategorie, sonst Fallback.
 */
export interface DevicePresenter {
  id: string;
  match: { type?: DeviceTypeId; category?: DeviceCategory };
  accent?: string;
  /** Präsentations-Tags (z. B. „RGB", „Batterie") — zusätzlich zu device.tags. */
  presentationTags?: (ctx: DevicePresentationContext) => string[];
  /** Optionaler Hero-Inhalt für die Device-Detail-Seite. */
  renderHeroExtras?: (ctx: DevicePresentationContext) => ReactNode;
  /** Zusätzliche Detail-Sections (rein informativ). */
  detailSections?: DeviceDetailSection[];
}
