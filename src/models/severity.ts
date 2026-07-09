/**
 * Generisches Severity-Modell (Teil 10).
 *
 * Wird gemeinsam genutzt von Timeline, Event Center, Notifications,
 * Discovery, WebSocket, Automationen und Systemmeldungen. Hier ist
 * ausschließlich die Datenstruktur definiert — keine Engine, keine UI.
 */

export type Severity = "info" | "success" | "warning" | "error" | "critical";

export const SEVERITIES: readonly Severity[] = [
  "info",
  "success",
  "warning",
  "error",
  "critical",
] as const;

/**
 * Ordinaler Rang. Größere Werte bedeuten höhere Priorität. Konsumenten
 * dürfen darüber sortieren oder Schwellwerte formulieren, ohne selbst
 * ein eigenes Mapping zu pflegen.
 */
export const SEVERITY_ORDER: Record<Severity, number> = {
  info: 0,
  success: 1,
  warning: 2,
  error: 3,
  critical: 4,
};

export function compareSeverity(a: Severity, b: Severity): number {
  return SEVERITY_ORDER[a] - SEVERITY_ORDER[b];
}

export function isAtLeast(actual: Severity, threshold: Severity): boolean {
  return SEVERITY_ORDER[actual] >= SEVERITY_ORDER[threshold];
}

export interface SeverityDescriptor {
  severity: Severity;
  /** Kurzer Klartext-Name (UI/Filter). */
  label: string;
  /** Semantischer Farb-Token (Design-System). */
  color: string;
  /** Lucide-Icon-Name. */
  icon: string;
  /** Ordinaler Rang, siehe {@link SEVERITY_ORDER}. */
  order: number;
}

export const DEFAULT_SEVERITY_DESCRIPTORS: Record<Severity, SeverityDescriptor> = {
  info: { severity: "info", label: "Info", color: "muted", icon: "info", order: 0 },
  success: { severity: "success", label: "Erfolg", color: "success", icon: "check-circle", order: 1 },
  warning: { severity: "warning", label: "Warnung", color: "warning", icon: "alert-triangle", order: 2 },
  error: { severity: "error", label: "Fehler", color: "destructive", icon: "alert-octagon", order: 3 },
  critical: { severity: "critical", label: "Kritisch", color: "destructive", icon: "siren", order: 4 },
};
