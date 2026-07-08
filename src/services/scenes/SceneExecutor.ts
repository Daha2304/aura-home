import type { Scene, SceneAction } from "@/models/scene";
import type {
  SceneExecution,
  SceneExecutionStep,
  SceneUndoEntry,
} from "@/models/sceneExecution";
import { commandQueue } from "@/services/commands/CommandQueue";
import { createId } from "@/utils/ids";
import { createLogger } from "@/services/logger/Logger";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { useSceneExecutionsStore } from "@/store/slices/sceneExecutionsStore";
import { useScenesStore } from "@/store/slices/scenesStore";
import { groupResolver } from "@/services/groups/GroupResolver";
import { sceneEvents } from "./SceneEvents";
import { sceneRegistry } from "./SceneRegistry";

const log = createLogger("scene-executor");

interface ResolvedTarget {
  deviceId: string;
  capabilityId: string;
  targetValue: unknown;
  previousValue?: unknown;
  action: SceneAction;
}

function resolveTargets(action: SceneAction): ResolvedTarget[] {
  const devicesState = useDevicesStore.getState();
  const targets: ResolvedTarget[] = [];
  const push = (deviceId: string) => {
    const d = devicesState.byId(deviceId);
    if (!d) return;
    const cap = (d.capabilities ?? []).find((c) => c.id === action.capabilityId);
    if (!cap) return;
    const prev = (cap as { value?: unknown }).value;
    targets.push({
      deviceId,
      capabilityId: action.capabilityId,
      targetValue: action.targetValue,
      previousValue: prev,
      action,
    });
  };
  if (action.deviceId) push(action.deviceId);
  if (action.groupId) {
    for (const id of groupResolver.expand(action.groupId)) push(id);
  }
  return targets;
}

/**
 * Executes scenes exclusively through the existing CommandQueue.
 * Tracks progress via correlationId listeners. Captures an undo
 * snapshot up-front; the actual `undo(...)` handler is prepared but
 * not yet enabled (Teil 9/10).
 */
export class SceneExecutorImpl {
  private started = false;
  private readonly unsubs: Array<() => void> = [];
  /** correlationId → executionId */
  private readonly corrToExec = new Map<string, string>();
  /** commandId → { executionId, actionId } */
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

  run(sceneId: string, args?: Record<string, unknown>): SceneExecution | undefined {
    const scene = sceneRegistry.get(sceneId);
    if (!scene) return undefined;
    const execId = createId("sexec");
    const now = Date.now();

    // Plan: resolve each action to concrete device targets.
    const plan: Array<{ action: SceneAction; targets: ResolvedTarget[] }> = [];
    for (const a of scene.actions) {
      const targets = resolveTargets(a);
      plan.push({ action: a, targets });
    }
    const total = plan.reduce((n, p) => n + p.targets.length, 0);

    const steps: SceneExecutionStep[] = [];
    const undoSnapshot: SceneUndoEntry[] = [];
    for (const { action, targets } of plan) {
      for (const t of targets) {
        steps.push({
          actionId: action.id,
          deviceId: t.deviceId,
          capabilityId: t.capabilityId,
          targetValue: t.targetValue,
          previousValue: t.previousValue,
          commandIds: [],
          state: "pending",
        });
        if (t.previousValue !== undefined) {
          undoSnapshot.push({
            deviceId: t.deviceId,
            capabilityId: t.capabilityId,
            previousValue: t.previousValue,
          });
        }
      }
    }

    const exec: SceneExecution = {
      id: execId,
      sceneId,
      status: "planned",
      startedAt: now,
      progress: { total, completed: 0, failed: 0, cancelled: 0 },
      steps,
      undoable: undoSnapshot.length > 0,
      undoSnapshot,
      args,
    };
    useSceneExecutionsStore.getState().upsert(exec);
    sceneEvents.emit("sceneExecutionStarted", { execution: exec });
    useScenesStore.getState().markRecent(sceneId);

    if (total === 0) {
      exec.status = "succeeded";
      exec.finishedAt = Date.now();
      useSceneExecutionsStore.getState().upsert(exec);
      sceneEvents.emit("sceneExecutionCompleted", { execution: exec });
      sceneEvents.emit("sceneExecuted", { execution: exec });
      return exec;
    }

    // Sort plan by priority (desc within the same delay bucket).
    const sortedPlan = [...plan].sort((a, b) => {
      const d = (a.action.delayMs ?? 0) - (b.action.delayMs ?? 0);
      if (d !== 0) return d;
      return (b.action.priority ?? 0) - (a.action.priority ?? 0);
    });

    exec.status = "running";
    useSceneExecutionsStore.getState().upsert(exec);

    let aborted = false;
    for (const { action, targets } of sortedPlan) {
      const delay = Math.max(0, action.delayMs ?? 0);
      const dispatch = () => {
        if (aborted) return;
        for (const t of targets) {
          const cmd = commandQueue.enqueue(t.deviceId, t.capabilityId, t.targetValue, {
            optimistic: true,
            correlationId: execId,
          });
          const step = exec.steps.find(
            (s) => s.actionId === action.id && s.deviceId === t.deviceId,
          );
          if (step) {
            step.commandIds.push(cmd.id);
            step.state = "running";
            step.startedAt = Date.now();
          }
          this.cmdToStep.set(cmd.id, { execId, actionId: action.id });
        }
        useSceneExecutionsStore.getState().upsert(exec);
      };
      if (delay === 0) dispatch();
      else setTimeout(dispatch, delay);
    }
    void aborted; // reserved for future cancel()

    this.corrToExec.set(execId, execId);
    log.info("scene run", sceneId, "execId=", execId, "targets=", total);
    return exec;
  }

  /**
   * Undo prepared but not yet enabled. The undoSnapshot is stored on the
   * execution and can be consumed by later automations infrastructure.
   */
  undo(_executionId: string): never {
    throw new Error("SceneExecutor.undo is prepared but not enabled in Teil 8");
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
    const store = useSceneExecutionsStore.getState();
    const exec = store.byId[execId];
    if (!exec) return;
    const step = exec.steps.find(
      (s) => s.actionId === meta.actionId && s.commandIds.includes(commandId),
    );
    if (step && step.state === "running") {
      step.state = state === "succeeded" ? "succeeded" : state === "failed" ? "failed" : "cancelled";
      step.finishedAt = Date.now();
      if (error) step.error = error;
    }
    if (state === "succeeded") exec.progress.completed += 1;
    else if (state === "failed") exec.progress.failed += 1;
    else exec.progress.cancelled += 1;

    const done =
      exec.progress.completed + exec.progress.failed + exec.progress.cancelled >=
      exec.progress.total;
    if (done) {
      exec.finishedAt = Date.now();
      exec.status = exec.progress.failed === 0 && exec.progress.cancelled === 0
        ? "succeeded"
        : exec.progress.completed === 0
          ? "failed"
          : "partial";
    }
    store.upsert(exec);
    sceneEvents.emit("sceneExecutionProgress", { execution: exec });
    if (done) {
      if (exec.status === "failed") {
        sceneEvents.emit("sceneExecutionFailed", {
          execution: exec,
          reason: "commands_failed",
        });
      } else {
        sceneEvents.emit("sceneExecutionCompleted", { execution: exec });
      }
      sceneEvents.emit("sceneExecuted", { execution: exec });
      this.corrToExec.delete(correlationId);
    }
  }
}

export const sceneExecutor = new SceneExecutorImpl();
