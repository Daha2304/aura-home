import type { WidgetCategory } from "./widgetCategory";
import type { LayoutBreakpoint, WidgetPlacement } from "./layout";
import type { WidgetInstance, WidgetTypeId } from "./widgetInstance";

export interface WidgetSizeSpec {
  w: number;
  h: number;
}

export type WidgetCapability =
  | "resizable"
  | "movable"
  | "configurable"
  | "refreshable"
  | "exportable"
  | "themeable"
  | "backgroundable"
  | "requires-connection"
  | "requires-auth";

export interface WidgetSettingsField {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "select" | "color" | "device" | "room" | "scene" | "custom";
  required?: boolean;
  default?: unknown;
  options?: Array<{ value: string; label: string }>;
}

export interface WidgetDescriptor {
  id: WidgetTypeId;
  name: string;
  category: WidgetCategory;
  description: string;
  icon: string;
  defaultSize: WidgetSizeSpec;
  minSize: WidgetSizeSpec;
  maxSize: WidgetSizeSpec;
  supportedLayouts: LayoutBreakpoint[];
  settings: WidgetSettingsField[];
  capabilities: WidgetCapability[];
  version: number;
  /** Optionaler Instance-Factory-Override. Der WidgetManager füllt sonst
   *  Defaults aus dem Descriptor. */
  createDefaults?: () => Partial<WidgetInstance>;
  /** Optionale Placement-Empfehlung pro Breakpoint. */
  defaultPlacement?: Partial<Record<LayoutBreakpoint, WidgetPlacement>>;
}

export function defineWidget(desc: WidgetDescriptor): WidgetDescriptor {
  return desc;
}
