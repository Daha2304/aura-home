import type { ComponentType } from "react";
import type { ControlSpec } from "@/models/controlSpec";
import { createLogger } from "@/services/logger/Logger";

const log = createLogger("controls");

export interface ControlProps {
  spec: ControlSpec;
  onCommit: (value: unknown) => void;
  disabled?: boolean;
}

export interface ControlBinding {
  controlType: string;
  component: ComponentType<ControlProps>;
  /** Optional per-control validator (extra to descriptor validation). */
  validate?: (value: unknown, spec: ControlSpec) => unknown;
  /** Optional per-control formatter. */
  format?: (value: unknown, spec: ControlSpec) => string;
}

class ControlRegistryImpl {
  private readonly byType = new Map<string, ControlBinding>();

  register(binding: ControlBinding): void {
    this.byType.set(binding.controlType, binding);
    log.debug("registered control", binding.controlType);
  }

  resolve(controlType: string): ControlBinding | undefined {
    return this.byType.get(controlType);
  }

  /** Pick the first registered control from a descriptor's preferred list. */
  resolveWithFallback(types: readonly string[]): ControlBinding | undefined {
    for (const t of types) {
      const b = this.byType.get(t);
      if (b) return b;
    }
    return undefined;
  }

  all(): ControlBinding[] {
    return Array.from(this.byType.values());
  }

  clear(): void {
    this.byType.clear();
  }
}

export const controlRegistry = new ControlRegistryImpl();
