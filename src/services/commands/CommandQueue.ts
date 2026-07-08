import type { Command, CommandState } from "@/models/command";
import { AppError } from "@/services/errors/AppError";
import { errorBus } from "@/services/errors/ErrorBus";
import { TypedEmitter } from "@/services/events/EventEmitter";
import { createLogger } from "@/services/logger/Logger";
import { wsManager } from "@/services/websocket/WebSocketManager";
import { useCommandsStore } from "@/store/slices/commandsStore";
import { commandTracker } from "./CommandTracker";
import { createId } from "@/utils/ids";

const log = createLogger("commands");

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_MAX_ATTEMPTS = 3;

interface CommandQueueEventMap {
  enqueued: Command;
  stateChanged: Command;
  completed: Command;
  failed: Command;
  cancelled: Command;
}

export interface EnqueueOptions {
  optimistic?: boolean;
  timeoutMs?: number;
  maxAttempts?: number;
  correlationId?: string;
}

/**
 * Zentrale Command-Queue. Sitzt eine Schicht über {@link wsManager} — der
 * Manager selbst kennt nur rohe Nachrichten und puffert die eigene Offline-Queue.
 * Diese Queue verwaltet zusätzlich Zustände, Retries und Rollback.
 */
class CommandQueueImpl extends TypedEmitter<CommandQueueEventMap> {
  private readonly pending = new Map<string, Command>();
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private started = false;
  private unsubs: Array<() => void> = [];

  start(): void {
    if (this.started) return;
    this.started = true;

    // Erst nach erfolgreicher Verbindung Commands abfeuern, die im Store liegen.
    this.unsubs.push(
      wsManager.on("authenticated", () => this.flushQueued()),
      wsManager.on("connected", () => this.flushQueued()),
      // Ack-Erkennung: eine device.state auf den gleichen key gilt als Bestätigung.
      wsManager.dispatcher.on("device.state", (e) => {
        this.onPossibleAck(e.deviceId, e.key);
      }),
    );
    log.info("started");
  }

  stop(): void {
    if (!this.started) return;
    for (const off of this.unsubs) off();
    this.unsubs = [];
    for (const t of this.timers.values()) clearTimeout(t);
    this.timers.clear();
    this.pending.clear();
    commandTracker.clear();
    this.started = false;
  }

  enqueue(
    deviceId: string,
    key: string,
    value: unknown,
    opts: EnqueueOptions = {},
  ): Command {
    const now = Date.now();
    const cmd: Command = {
      id: createId("cmd"),
      deviceId,
      key,
      value,
      state: "queued",
      attempts: 0,
      maxAttempts: opts.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
      timeoutMs: opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      createdAt: now,
      updatedAt: now,
      correlationId: opts.correlationId,
      optimistic: opts.optimistic,
    };
    this.pending.set(cmd.id, cmd);
    useCommandsStore.getState().upsert(cmd);
    this.emit("enqueued", cmd);

    if (opts.optimistic) {
      const snap = commandTracker.applyOptimistic(cmd);
      if (snap) cmd.previousValue = snap.previousValue;
    }
    this.dispatch(cmd);
    return cmd;
  }

  cancel(id: string): void {
    const cmd = this.pending.get(id);
    if (!cmd) return;
    if (cmd.optimistic) commandTracker.rollback(id);
    this.transition(cmd, "cancelled");
    this.emit("cancelled", cmd);
    this.cleanup(id);
  }

  retry(id: string): void {
    const cmd = this.pending.get(id);
    if (!cmd) return;
    if (cmd.attempts >= cmd.maxAttempts) {
      this.fail(cmd, "max_attempts");
      return;
    }
    this.transition(cmd, "retrying");
    this.dispatch(cmd);
  }

  ack(id: string): void {
    const cmd = this.pending.get(id);
    if (!cmd) return;
    this.transition(cmd, "acknowledged");
  }

  private dispatch(cmd: Command): void {
    cmd.attempts += 1;
    this.transition(cmd, "sending");
    wsManager.send({
      type: "command",
      deviceId: cmd.deviceId,
      key: cmd.key,
      value: cmd.value,
      requestId: cmd.id,
    });
    this.transition(cmd, "sent");

    const timer = setTimeout(() => this.onTimeout(cmd.id), cmd.timeoutMs);
    this.timers.set(cmd.id, timer);
  }

  private onTimeout(id: string): void {
    const cmd = this.pending.get(id);
    if (!cmd) return;
    this.timers.delete(id);
    if (cmd.state === "completed" || cmd.state === "cancelled") return;
    if (cmd.attempts < cmd.maxAttempts) {
      this.retry(id);
    } else {
      this.fail(cmd, "timeout");
    }
  }

  private onPossibleAck(deviceId: string, key: string): void {
    // Der erste passende, noch offene Command gilt als bestätigt.
    for (const cmd of this.pending.values()) {
      if (cmd.deviceId === deviceId && cmd.key === key) {
        if (cmd.state === "sending" || cmd.state === "sent" || cmd.state === "retrying") {
          this.complete(cmd);
          return;
        }
      }
    }
  }

  private complete(cmd: Command): void {
    this.transition(cmd, "completed");
    if (cmd.optimistic) commandTracker.confirm(cmd.id);
    this.emit("completed", cmd);
    this.cleanup(cmd.id);
  }

  private fail(cmd: Command, code: string): void {
    cmd.error = { code, message: `Command fehlgeschlagen: ${code}` };
    this.transition(cmd, "failed");
    if (cmd.optimistic) commandTracker.rollback(cmd.id);
    errorBus.report(
      new AppError("timeout", cmd.error.message, {
        code,
        context: { commandId: cmd.id, deviceId: cmd.deviceId, key: cmd.key },
      }),
    );
    this.emit("failed", cmd);
    this.cleanup(cmd.id);
  }

  private transition(cmd: Command, state: CommandState): void {
    cmd.state = state;
    cmd.updatedAt = Date.now();
    useCommandsStore.getState().upsert(cmd);
    this.emit("stateChanged", cmd);
  }

  private cleanup(id: string): void {
    const t = this.timers.get(id);
    if (t) clearTimeout(t);
    this.timers.delete(id);
    this.pending.delete(id);
  }

  private flushQueued(): void {
    for (const cmd of Array.from(this.pending.values())) {
      if (cmd.state === "queued") this.dispatch(cmd);
    }
  }
}

export const commandQueue = new CommandQueueImpl();
