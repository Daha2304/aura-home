/**
 * Automation Descriptor Registries.
 *
 * Vorbereitet in Teil 8, in Teil 9 mit Descriptor-Bodies + Built-ins
 * bestückt. Trigger/Condition/Action-Descriptor liefern jeweils reine
 * Callbacks — jegliche Ausführung läuft ausschließlich über die
 * bestehende CommandQueue bzw. bestehende Manager (SceneExecutor,
 * GroupExecutor, AutomationVariablesStore).
 */

import type { Command } from "@/models/command";

/** Handle zum Widerruf einer Trigger-Subscription. */
export type Unsubscribe = () => void;

export interface TriggerFireContext<P = unknown> {
  /** Optionaler Trigger-Payload für Executor/Debug. */
  payload?: P;
}

export interface TriggerContext {
  automationId: string;
  triggerId: string;
}

export interface TriggerDescriptor<Cfg = Record<string, unknown>, P = unknown> {
  id: string;
  label: string;
  version: number;
  category?: string;
  description?: string;
  /**
   * Startet die Live-Überwachung dieses Triggers und ruft `fire()` bei
   * jedem Ereignis auf. Rückgabe: Unsubscribe.
   */
  subscribe(
    ctx: TriggerContext,
    config: Cfg,
    fire: (payload?: P) => void,
  ): Unsubscribe;
}

export interface ConditionEvalContext {
  automationId: string;
  triggerPayload?: unknown;
}

export interface ConditionDescriptor<Cfg = Record<string, unknown>> {
  id: string;
  label: string;
  version: number;
  category?: string;
  description?: string;
  evaluate(ctx: ConditionEvalContext, config: Cfg): boolean;
}

/**
 * Von einer Action geplantes Kommando. Wird vom Executor ausschließlich
 * über {@link commandQueue.enqueue} versendet.
 */
export interface PlannedCommand {
  deviceId: string;
  capabilityId: string;
  value: unknown;
}

/**
 * Manche Actions führen keine Command-Queue-Operation aus (delay,
 * variable.set, scene.start, automation.enable/disable). Sie liefern
 * eine `run()`-Funktion, die der Executor await-t. Actions dürfen auch
 * beides liefern (Commands + Side-Effect).
 */
export interface ActionPlan {
  commands?: PlannedCommand[];
  /** Optionaler Side-Effect, muss idempotent bleiben. */
  run?: () => Promise<void> | void;
  /** Optionaler Delay vor der Ausführung (ergänzt AutomationAction.delayMs). */
  extraDelayMs?: number;
}

export interface ActionPlanContext {
  automationId: string;
  executionId: string;
  correlationId: string;
  triggerPayload?: unknown;
}

export interface ActionDescriptor<Cfg = Record<string, unknown>> {
  id: string;
  label: string;
  version: number;
  category?: string;
  description?: string;
  /** Plant Commands/Side-Effects. Kein direkter WS-Zugriff erlaubt. */
  plan(ctx: ActionPlanContext, config: Cfg): ActionPlan;
}

class DescriptorRegistry<T extends { id: string; version: number }> {
  private readonly byId = new Map<string, T>();

  register(descriptor: T): void {
    const existing = this.byId.get(descriptor.id);
    if (existing && existing.version > descriptor.version) return;
    this.byId.set(descriptor.id, descriptor);
  }

  get(id: string): T | undefined {
    return this.byId.get(id);
  }

  all(): T[] {
    return Array.from(this.byId.values());
  }

  ids(): string[] {
    return Array.from(this.byId.keys());
  }

  unregister(id: string): boolean {
    return this.byId.delete(id);
  }
}

export const triggerRegistry = new DescriptorRegistry<TriggerDescriptor>();
export const conditionRegistry = new DescriptorRegistry<ConditionDescriptor>();
export const actionRegistry = new DescriptorRegistry<ActionDescriptor>();

// Re-export für Konsumenten, die Command-Typen brauchen.
export type { Command };
