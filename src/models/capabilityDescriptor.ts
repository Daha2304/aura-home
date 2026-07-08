import type { ComponentType } from "react";
import type { Capability } from "./capability";

export type CapabilityCategory =
  | "general"
  | "lighting"
  | "climate"
  | "media"
  | "sensor"
  | "energy"
  | "network"
  | "system"
  | "custom";

export type CapabilityDataType =
  | "boolean"
  | "number"
  | "string"
  | "enum"
  | "color"
  | "composite";

export interface CapabilityValidation {
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  enum?: readonly string[];
}

export type CapabilityKind = Capability["kind"];

export interface CapabilityDescriptor {
  /** Unique identifier of the descriptor (equals kind for built-ins). */
  id: string;
  kind: CapabilityKind | (string & {});
  version: number;
  name: string;
  description?: string;
  category: CapabilityCategory;
  dataType: CapabilityDataType;
  unit?: string;
  icon?: ComponentType<{ className?: string }>;
  /** Higher = shown first inside its group. */
  priority: number;
  readOnly?: boolean;
  validation?: CapabilityValidation;
  defaultValue?: unknown;
  format?: (value: unknown) => string;
  /** Primary control type used by the factory. */
  controlType: string;
  /** Optional fallback control types. */
  altControlTypes?: readonly string[];
  events?: readonly string[];
  custom?: Record<string, unknown>;
}
