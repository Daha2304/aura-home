import {
  DEFAULT_SEVERITY_DESCRIPTORS,
  type Severity,
  type SeverityDescriptor,
} from "@/models/severity";

/**
 * Leichtgewichtige Descriptor-Tabelle für Severity-Werte. Rein deklarativ,
 * kein Runtime-Verhalten.
 */
class SeverityRegistry {
  private readonly map = new Map<Severity, SeverityDescriptor>(
    Object.entries(DEFAULT_SEVERITY_DESCRIPTORS) as [Severity, SeverityDescriptor][],
  );

  register(descriptor: SeverityDescriptor): void {
    this.map.set(descriptor.severity, descriptor);
  }

  get(severity: Severity): SeverityDescriptor {
    return this.map.get(severity) ?? DEFAULT_SEVERITY_DESCRIPTORS[severity];
  }

  list(): SeverityDescriptor[] {
    return Array.from(this.map.values()).sort((a, b) => a.order - b.order);
  }
}

export const severityRegistry = new SeverityRegistry();
