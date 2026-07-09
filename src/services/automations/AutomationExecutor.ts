import type {
  Automation,
  AutomationAction,
  ConditionNode,
} from "@/models/automation";
import type {
  AutomationExecution,
  AutomationExecutionStep,
  AutomationRollbackEntry,
} from "@/models/automationExecution";
import { commandQueue } from "@/services/commands/CommandQueue";
import { createId } from "@/utils/ids";
import { createLogger } from "@/services/logger/Logger";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { useAutomationExecutionsStore } from "@/store/slices/automationExecutionsStore";
import { useAutomationsStore } from "@/store/slices/automationsStore";
import { automationEvents } from "./AutomationEvents";
import {
  actionRegistry,
  conditionRegistry,
  type ActionPlan,
  type PlannedCommand,
} from "./descriptors";
import { automationRegistry } from "./AutomationRegistry";

const log = createLogger("automation-executor");

function evaluateConditions(node: ConditionNode | undefined, automationId: string, triggerPayload?: unknown): boolean {
  if (!node) return true;
  if (node.kind === "and") {
    const n = node as { children: ConditionNode[] };
    return n.children.every((c) => evaluateConditions(c, automationId, triggerPayload));
  }
  if (node.kind === "or") {
    const n = node as { children: ConditionNode[] };
    return n.children.some((c) => evaluateConditions(c, automationId, triggerPayload));
  }
  if (node.kind === "not") {
    const n = node as { child: ConditionNode };
    return !evaluateConditions(n.child, automationId, triggerPayload);
  }
  const desc = conditionRegistry.get(node.kind);
  if (!desc) {
    log.warn("unknown condition kind, treating as false:", node.kind);
    return false;
  }
  try {
    return desc.evaluate({ automationId, triggerPayload }, (node as { config: Record<string, unknown> }).config);
  } catch (err) {
    log.error("condition evaluate failed:", node.kind, err);
    return false;
  }
}

interface RunOptions {
  triggerId?: string;
  triggerPayload?: unknown;
}

/**
 * Führt Automationen aus. Conditions → Action Pipeline → CommandQueue.
 * Fortschritt wird über correlationId von der CommandQueue rückgemeldet.
 * Rollback wird nur vorbereitet (Snapshot), aber nicht ausgeführt.
 */
class AutomationExecutorImpl {
  private started = false;
  private readonly unsubs: Array<() => void> = [];
  /** correlationId → executionId */
  private readonly corrToExec = new Map<string, string>();
  /** commandId → { execId, actionId } */
  private readonly cmdToStep = new Map<string, { execId: string; actionId: string }>();

  start(): void {
    if (this.started) return;
    this.started = true;
    this.unsubs.push(
      commandQueue.on("completed", (c) => this.onCommand(c.id, c.correlationId, "succeeded")),
      commandQueue.on("failed", (c) => this.onCommand(c.id, c.correlationId, "failed", c.error?.message)),
      commandQueue.on("cancelled", (c) => this.onCommand(c.id, c.correlationId, "cancelled")),
    );
  }

  stop(): void {
    for (const off of this.unsubs) off();
    this.unsubs.length = 0;
    this.corrToExec.clear();
    this.cmdToStep.clear();
    this.started = false;
  }

  run(automationId: string, opts: RunOptions = {}): AutomationExecution | undefined {
    const automation = automationRegistry.get(automationId);
    if (!automation) return undefined;
    const execId = createId("aexec");
    const correlationId = execId;
    const now = Date.now();
    const store = useAutomationExecutionsStore.getState();

    automationEvents.emit("automationTriggered", {
      id: automationId,
      triggerId: opts.triggerId ?? "manual",
      payload: opts.triggerPayload,
    });

    // Conditions vorab prüfen.
    const conditionsResult = evaluateConditions(automation.conditions, automationId, opts.triggerPayload);
    if (!conditionsResult) {
      const exec: AutomationExecution = {
        id: execId,
        automationId,
        triggerId: opts.triggerId,
        status: "skipped-conditions",
        startedAt: now,
        finishedAt: now,
        progress: { total: 0, completed: 0, failed: 0, cancelled: 0 },
        steps: [],
        conditionsResult: false,
        rollbackSnapshot: [],
        correlationId,
        triggerPayload: opts.triggerPayload,
      };
      store.upsert(exec);
      automationEvents.emit("automationCompleted", { execution: exec });
      return exec;
    }

    // Actions vorab planen.
    const planned: Array<{ action: AutomationAction; plan: ActionPlan }> = [];
    for (const action of automation.actions) {
      const desc = actionRegistry.get(action.kind);
      if (!desc) {
        log.warn("unknown action kind, skipping:", action.kind);
        continue;
      }
      try {
        const plan = desc.plan(
          { automationId, executionId: execId, correlationId, triggerPayload: opts.triggerPayload },
          action.config,
        );
        planned.push({ action, plan });
      } catch (err) {
        log.error("action plan failed:", action.kind, err);
      }
    }

    // Rollback-Snapshot vorbereiten (nur befüllen).
    const rollbackSnapshot: AutomationRollbackEntry[] = [];
    const devices = useDevicesStore.getState();
    for (const p of planned) {
      for (const c of p.plan.commands ?? []) {
        const d = devices.byId(c.deviceId);
        if (!d) continue;
        const cap = (d.capabilities ?? []).find((x) => x.id === c.capabilityId);
        if (cap && (cap as { value?: unknown }).value !== undefined) {
          rollbackSnapshot.push({
            deviceId: c.deviceId,
            capabilityId: c.capabilityId,
            previousValue: (cap as { value: unknown }).value,
          });
        }
      }
    }

    const steps: AutomationExecutionStep[] = planned.map((p) => ({
      actionId: p.action.id,
      kind: p.action.kind,
      commandIds: [],
      state: "pending",
    }));
    const total = planned.reduce((n, p) => n + (p.plan.commands?.length ?? 0), 0);

    const exec: AutomationExecution = {
      id: execId,
      automationId,
      triggerId: opts.triggerId,
      status: "running",
      startedAt: now,
      progress: { total, completed: 0, failed: 0, cancelled: 0 },
      steps,
      conditionsResult: true,
      rollbackSnapshot,
      correlationId,
      triggerPayload: opts.triggerPayload,
    };
    store.upsert(exec);
    automationEvents.emit("automationStarted", { execution: exec });
    useAutomationsStore.getState().markRecent(automationId);
    this.corrToExec.set(correlationId, execId);

    // Sequenzierung: nach delayMs (asc), gleiche Verzögerung parallel.
    const sorted = [...planned].sort(
      (a, b) => (a.action.delayMs ?? 0) - (b.action.delayMs ?? 0),
    );

    const dispatchOne = async (item: { action: AutomationAction; plan: ActionPlan }) => {
      const step = exec.steps.find((s) => s.actionId === item.action.id);
      if (step) {
        step.state = "running";
        step.startedAt = Date.now();
      }
      // Side-Effect zuerst (delay, variable.set, scene.start, …)
      if (item.plan.run) {
        try {
          await item.plan.run();
        } catch (err) {
          if (step) {
            step.state = "failed";
            step.error = (err as Error).message;
            step.finishedAt = Date.now();
          }
          if (!item.action.optional && item.action.errorStrategy !== "continue") {
            log.warn("action side-effect failed, strategy=", item.action.errorStrategy);
          }
        }
      }
      // Commands über Command Queue (kein direkter WS-Aufruf).
      for (const c of item.plan.commands ?? []) {
        const cmd = this.enqueueCommand(c, correlationId);
        if (step) step.commandIds.push(cmd.id);
        this.cmdToStep.set(cmd.id, { execId, actionId: item.action.id });
      }
      if (step && (!item.plan.commands || item.plan.commands.length === 0)) {
        step.state = step.state === "failed" ? "failed" : "succeeded";
        step.finishedAt = Date.now();
      }
      store.upsert(exec);
      this.maybeFinalize(execId);
    };

    for (const item of sorted) {
      const delay = Math.max(0, (item.action.delayMs ?? 0) + (item.plan.extraDelayMs ?? 0));
      if (delay === 0) void dispatchOne(item);
      else setTimeout(() => void dispatchOne(item), delay);
    }

    log.info("automation run", automationId, "execId=", execId, "commands=", total);
    // Sofortfinalisieren, falls nichts geplant war.
    if (total === 0 && sorted.length === 0) {
      this.maybeFinalize(execId, true);
    }
    return exec;
  }

  private enqueueCommand(c: PlannedCommand, correlationId: string) {
    return commandQueue.enqueue(c.deviceId, c.capabilityId, c.value, {
      optimistic: true,
      correlationId,
    });
  }

  private onCommand(
    commandId: string,
    correlationId: string | undefined,
    state: "succeeded" | "failed" | "cancelled",
    error?: string,
  ): void {
    if (!correlationId) return;
    const execId = this.corrToExec.get(correlationId);
    if (!execId) return;
    const meta = this.cmdToStep.get(commandId);
    if (!meta) return;
    const store = useAutomationExecutionsStore.getState();
    const exec = store.byId[execId];
    if (!exec) return;
    const step = exec.steps.find((s) => s.actionId === meta.actionId);
    if (step) {
      // Wenn dies das letzte Command des Steps ist:
      const allDone = step.commandIds.every((cid) => cid === commandId || this.cmdToStep.get(cid) === undefined);
      void allDone;
      if (state === "succeeded" && step.state === "running") {
        step.state = "succeeded";
      } else if (state === "failed") {
        step.state = "failed";
        if (error) step.error = error;
      } else if (state === "cancelled") {
        step.state = "cancelled";
      }
      step.finishedAt = Date.now();
    }
    if (state === "succeeded") exec.progress.completed += 1;
    else if (state === "failed") exec.progress.failed += 1;
    else exec.progress.cancelled += 1;

    store.upsert(exec);
    automationEvents.emit("automationProgress", { execution: exec });
    this.cmdToStep.delete(commandId);
    this.maybeFinalize(execId);
  }

  private maybeFinalize(execId: string, force = false): void {
    const store = useAutomationExecutionsStore.getState();
    const exec = store.byId[execId];
    if (!exec) return;
    const done =
      force ||
      exec.progress.completed + exec.progress.failed + exec.progress.cancelled >= exec.progress.total;
    // Alle Steps ohne Command-Anteil müssen ebenfalls terminal sein.
    const allStepsDone = exec.steps.every((s) => s.state !== "pending" && s.state !== "running");
    if (!done || !allStepsDone) return;
    if (exec.status !== "running" && exec.status !== "planned") return;

    exec.finishedAt = Date.now();
    if (exec.progress.failed === 0 && exec.progress.cancelled === 0) exec.status = "succeeded";
    else if (exec.progress.completed === 0 && exec.progress.total > 0) exec.status = "failed";
    else exec.status = "partial";

    store.upsert(exec);
    if (exec.status === "succeeded" || exec.status === "partial") {
      automationEvents.emit("automationCompleted", { execution: exec });
    } else if (exec.status === "failed") {
      automationEvents.emit("automationFailed", { execution: exec, reason: "commands_failed" });
    } else {
      automationEvents.emit("automationCancelled", { execution: exec });
    }
    this.corrToExec.delete(exec.correlationId);
  }

  /** Vorbereitet — führt aktuell nichts aus. */
  undo(_executionId: string): never {
    throw new Error("AutomationExecutor.undo is prepared but not enabled in Teil 9");
  }

  /** Automation manuell auslösen. */
  trigger(automationId: string, triggerId: string, payload?: unknown): AutomationExecution | undefined {
    const a = automationRegistry.get(automationId);
    if (!a || !a.enabled || a.archived) return undefined;
    return this.run(automationId, { triggerId, triggerPayload: payload });
  }
}

export const automationExecutor = new AutomationExecutorImpl();
export type { Automation };
