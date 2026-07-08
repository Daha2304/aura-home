import type { SceneParameterType } from "@/models/scene";

export interface SceneParameterTypeDescriptor {
  type: SceneParameterType;
  label: string;
  /** Whether the type supports numeric bounds. */
  numeric?: boolean;
  /** Whether the type carries an enum list. */
  enumerable?: boolean;
  /** Runtime validator. Returns true if the value fits the parameter. */
  validate: (value: unknown) => boolean;
}

/**
 * Registry of parameter type descriptors. Purely descriptive — no
 * execution logic. Prepared so Teil 9+ can plug in domain-specific
 * parameter types (e.g. `time`, `location`) without any core change.
 */
class SceneParameterRegistryImpl {
  private readonly byType = new Map<SceneParameterType, SceneParameterTypeDescriptor>();

  register(descriptor: SceneParameterTypeDescriptor): void {
    this.byType.set(descriptor.type, descriptor);
  }

  get(type: SceneParameterType): SceneParameterTypeDescriptor | undefined {
    return this.byType.get(type);
  }

  all(): SceneParameterTypeDescriptor[] {
    return Array.from(this.byType.values());
  }
}

export const sceneParameterRegistry = new SceneParameterRegistryImpl();

export function registerBuiltinSceneParameterTypes(): void {
  const items: SceneParameterTypeDescriptor[] = [
    { type: "boolean", label: "Boolean", validate: (v) => typeof v === "boolean" },
    { type: "number", label: "Zahl", numeric: true, validate: (v) => typeof v === "number" && Number.isFinite(v) },
    { type: "string", label: "Text", validate: (v) => typeof v === "string" },
    { type: "enum", label: "Auswahl", enumerable: true, validate: (v) => typeof v === "string" },
    { type: "device", label: "Gerät", validate: (v) => typeof v === "string" },
    { type: "group", label: "Gruppe", validate: (v) => typeof v === "string" },
    { type: "capability", label: "Capability", validate: (v) => typeof v === "string" },
    { type: "color", label: "Farbe", validate: (v) => typeof v === "string" },
  ];
  for (const i of items) sceneParameterRegistry.register(i);
}
