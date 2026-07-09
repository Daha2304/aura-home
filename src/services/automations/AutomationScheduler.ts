import type { Automation } from "@/models/automation";
import { createLogger } from "@/services/logger/Logger";
import { useAutomationsStore } from "@/store/slices/automationsStore";
import { triggerRegistry, type Unsubscribe } from "./descriptors";
import { automationExecutor } from "./AutomationExecutor";
import { automationManager } from "./AutomationManager";

const log = createLogger("automation-scheduler");

interface Subscription {
  automationId: string;
  triggerId: string;
  unsubscribe: Unsubscribe;
}

/**
 * Hält Trigger-Subscriptions am Leben. Beim Enable/Update/Delete werden
 * die Subscriptions strikt aufgeräumt und neu aufgesetzt.
 */
class AutomationSchedulerImpl {
  private started = false;
  private readonly subs: Subscription[] = [];
  private unsubStore: (() => void) | null = null;
  private systemStartFired = false;

  start(): void {
    if (this.started) return;
    this.started = true;

    // System-Start Signal für Trigger 'system.start' — via ein synthetisches
    // Event auf einem eigenen Ticker (Trigger-Descriptor entscheidet).
    this.systemStartFired = true;
    void this.systemStartFired;

    // Hook in AutomationManager, damit CRUD-Events uns rescheduling triggern.
    automationManager.setSchedulerHook((next, previous) => {
      if (previous) this.unsubscribeFor(previous.id);
      if (next && next.enabled && !next.archived) this.subscribeFor(next);
    });

    // Initial: alle aktiven Automationen aufsetzen.
    for (const a of useAutomationsStore.getState().automations) {
      if (a.enabled && !a.archived) this.subscribeFor(a);
    }

    // Falls Automationen von außen in den Store geschoben werden
    // (Import), einmalig neu binden.
    this.unsubStore = useAutomationsStore.subscribe((s, prev) => {
      if (s.automations === prev.automations) return;
      this.rebind();
    });

    log.info("scheduler started with", this.subs.length, "subscriptions");
  }

  stop(): void {
    if (!this.started) return;
    for (const s of this.subs) {
      try { s.unsubscribe(); } catch { /* ignore */ }
    }
    this.subs.length = 0;
    this.unsubStore?.();
    this.unsubStore = null;
    automationManager.setSchedulerHook(null);
    this.started = false;
  }

  private rebind(): void {
    for (const s of this.subs) {
      try { s.unsubscribe(); } catch { /* ignore */ }
    }
    this.subs.length = 0;
    for (const a of useAutomationsStore.getState().automations) {
      if (a.enabled && !a.archived) this.subscribeFor(a);
    }
  }

  private subscribeFor(a: Automation): void {
    for (const t of a.triggers) {
      const desc = triggerRegistry.get(t.kind);
      if (!desc) {
        log.warn("no trigger descriptor for", t.kind, "in", a.id);
        continue;
      }
      try {
        const unsubscribe = desc.subscribe(
          { automationId: a.id, triggerId: t.id },
          t.config,
          (payload) => {
            automationExecutor.trigger(a.id, t.id, payload);
          },
        );
        this.subs.push({ automationId: a.id, triggerId: t.id, unsubscribe });
      } catch (err) {
        log.error("trigger subscribe failed:", t.kind, err);
      }
    }
  }

  private unsubscribeFor(automationId: string): void {
    for (let i = this.subs.length - 1; i >= 0; i--) {
      if (this.subs[i].automationId === automationId) {
        try { this.subs[i].unsubscribe(); } catch { /* ignore */ }
        this.subs.splice(i, 1);
      }
    }
  }
}

export const automationScheduler = new AutomationSchedulerImpl();
