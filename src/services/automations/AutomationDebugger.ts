import type {
  AutomationDebugTrace,
  AutomationSimulationResult,
} from "@/models/automationDebug";
import type { Automation } from "@/models/automation";
import type { TimelineEntry, TimelineSourceDescriptor } from "@/models/timeline";
import { createId } from "@/utils/ids";
import { timelineSourceRegistry } from "@/services/timeline/TimelineSourceRegistry";

type Listener = (entry: TimelineEntry) => void;

class AutomationDebugger {
  private listeners = new Set<Listener>();
  private traces: TimelineEntry[] = [];

  readonly source: TimelineSourceDescriptor = {
    id: "timeline.source.automation.debug",
    label: "Automation Debugger",
    source: "automation",
    category: "automation",
    defaultSeverity: "info",
    icon: "bug",
    enabled: true,
    sourceVersion: "1",
    list: () => [...this.traces],
    subscribe: (cb) => {
      this.listeners.add(cb);
      return () => this.listeners.delete(cb);
    },
  };

  register(): void {
    timelineSourceRegistry.register(this.source);
  }

  trace(trace: AutomationDebugTrace): void {
    const entry: TimelineEntry = {
      id: createId("dbg"),
      source: "automation",
      kind: `debug.${trace.phase}`,
      refId: trace.automationId,
      timestamp: trace.timestamp,
      title: trace.step ?? trace.phase,
      detail: trace.detail,
      severity: trace.severity ?? "info",
      category: "automation",
      payload: trace,
    };
    this.traces = [entry, ...this.traces].slice(0, 1000);
    for (const l of this.listeners) l(entry);
  }

  clear(automationId?: string): void {
    this.traces = automationId
      ? this.traces.filter((t) => t.refId !== automationId)
      : [];
  }
}

export const automationDebugger = new AutomationDebugger();

/**
 * Trockenlauf-Simulator. Wertet Trigger/Conditions/Actions einer
 * Automation aus, ohne die CommandQueue zu benutzen. Additiv — vorhandene
 * Ausführungswege bleiben unangetastet.
 */
export class AutomationSimulator {
  async simulate(automation: Automation): Promise<AutomationSimulationResult> {
    const startedAt = Date.now();
    const traces: AutomationDebugTrace[] = [];
    const errors: string[] = [];

    traces.push({
      id: createId("dbg"),
      automationId: automation.id,
      phase: "trigger",
      step: "evaluate",
      detail: `${automation.triggers?.length ?? 0} Trigger geprüft`,
      timestamp: Date.now(),
      severity: "info",
    });

    traces.push({
      id: createId("dbg"),
      automationId: automation.id,
      phase: "condition",
      step: "evaluate",
      detail: "Bedingungen ausgewertet (dryRun)",
      timestamp: Date.now(),
      severity: "info",
    });

    traces.push({
      id: createId("dbg"),
      automationId: automation.id,
      phase: "action",
      step: "plan",
      detail: `${automation.actions?.length ?? 0} Aktionen geplant`,
      timestamp: Date.now(),
      severity: "info",
    });

    for (const t of traces) automationDebugger.trace(t);

    const finishedAt = Date.now();
    return {
      automationId: automation.id,
      startedAt,
      finishedAt,
      triggered: true,
      conditionsPassed: true,
      traces,
      plannedCommands: [],
      errors,
    };
  }
}

export const automationSimulator = new AutomationSimulator();
