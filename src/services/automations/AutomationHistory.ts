import type { TimelineEntry, TimelineSourceDescriptor } from "@/models/timeline";
import { automationEvents } from "./AutomationEvents";
import { createId } from "@/utils/ids";

const MAX_HISTORY = 500;

/**
 * Append-only Ringpuffer der Automationsereignisse — Vorbereitung für
 * die spätere Timeline (Teil 10). Wird als TimelineSourceDescriptor
 * exportiert, aber nicht registriert.
 */
class AutomationHistoryImpl {
  private entries: TimelineEntry[] = [];
  private readonly listeners = new Set<(e: TimelineEntry) => void>();
  private started = false;
  private unsubs: Array<() => void> = [];

  start(): void {
    if (this.started) return;
    this.started = true;
    this.unsubs.push(
      automationEvents.on("automationStarted", (p) => {
        this.push({
          source: "automation",
          refId: p.execution.automationId,
          kind: "started",
          title: "Automation gestartet",
          payload: { execId: p.execution.id },
        });
      }),
      automationEvents.on("automationCompleted", (p) => {
        this.push({
          source: "automation",
          refId: p.execution.automationId,
          kind: "completed",
          title: "Automation abgeschlossen",
          payload: {
            execId: p.execution.id,
            status: p.execution.status,
          },
        });
      }),
      automationEvents.on("automationFailed", (p) => {
        this.push({
          source: "automation",
          refId: p.execution.automationId,
          kind: "failed",
          title: "Automation fehlgeschlagen",
          detail: p.reason,
          payload: { execId: p.execution.id },
        });
      }),
    );
  }

  stop(): void {
    for (const u of this.unsubs) u();
    this.unsubs = [];
    this.started = false;
  }

  private push(part: Omit<TimelineEntry, "id" | "timestamp">): void {
    const entry: TimelineEntry = { id: createId("tl"), timestamp: Date.now(), ...part };
    this.entries.unshift(entry);
    if (this.entries.length > MAX_HISTORY) this.entries.length = MAX_HISTORY;
    for (const l of this.listeners) {
      try { l(entry); } catch { /* ignore */ }
    }
  }

  list(): TimelineEntry[] {
    return this.entries.slice();
  }

  subscribe(cb: (e: TimelineEntry) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /** TimelineSourceDescriptor — von einer späteren Timeline registrierbar. */
  descriptor(): TimelineSourceDescriptor {
    return {
      id: "automation-history",
      label: "Automationen",
      source: "automation",
      list: () => this.list(),
      subscribe: (cb) => this.subscribe(cb),
    };
  }
}

export const automationHistory = new AutomationHistoryImpl();
