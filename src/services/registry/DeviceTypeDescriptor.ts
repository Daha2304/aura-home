import type { HexColor, IconName } from "@/models/common";
import type { DeviceFunctionKind } from "@/models/device";
import type { CapabilityFlag } from "@/models/deviceCapability";
import type { DeviceCategory } from "@/models/deviceCategory";
import type { DeviceTypeId } from "@/models/deviceType";
import type { WidgetType } from "@/models/widget";

/** Vorbereitete Chart-Arten. Werden erst in einem späteren Schritt gerendert. */
export type ChartKind =
  | "line"
  | "bar"
  | "area"
  | "gauge"
  | "heatmap"
  | "pie"
  | "stackedBar";

/**
 * Deklarative Beschreibung eines Gerätetyps.
 *
 * Registry-Einträge sind reine Daten — keine JSX-Referenzen, keine Imports
 * auf UI-Komponenten. `control`/`detail` sind Slugs, die eine spätere
 * Control-Registry zu Komponenten auflöst. So bleibt die Registry
 * SSR-sicher und tree-shake-freundlich.
 */
export interface DeviceTypeDescriptor {
  id: DeviceTypeId;
  name: string;
  category: DeviceCategory;
  icon: IconName;
  color: HexColor;
  capabilities: CapabilityFlag[];
  functions: DeviceFunctionKind[];
  defaultWidgets: WidgetType[];
  /** Slug für die Standard-Steuerung, z.B. "control.light". */
  control?: string;
  /** Slug für die Detailansicht, z.B. "detail.light". */
  detail?: string;
  charts?: ChartKind[];
  /** Freie, protokollspezifische Zusatzinfos. */
  meta?: Record<string, unknown>;
}
