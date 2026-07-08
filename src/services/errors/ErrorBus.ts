import { TypedEmitter } from "@/services/events/EventEmitter";
import { AppError, type AppErrorPayload } from "./AppError";
import { createLogger } from "@/services/logger/Logger";

const log = createLogger("errors");

interface ErrorEventMap {
  error: AppErrorPayload;
}

class ErrorBus extends TypedEmitter<ErrorEventMap> {
  report(err: AppError | Error | unknown, context?: Record<string, unknown>): AppErrorPayload {
    const payload = normalize(err, context);
    log.error(payload.kind, payload.message, payload.context ?? {});
    this.emit("error", payload);
    return payload;
  }
}

function normalize(err: unknown, context?: Record<string, unknown>): AppErrorPayload {
  if (err instanceof AppError) {
    return { ...err.toPayload(), context: { ...(err.context ?? {}), ...(context ?? {}) } };
  }
  if (err instanceof Error) {
    return {
      kind: "unknown",
      message: err.message,
      cause: err,
      context,
      timestamp: Date.now(),
    };
  }
  return {
    kind: "unknown",
    message: typeof err === "string" ? err : "Unbekannter Fehler",
    cause: err,
    context,
    timestamp: Date.now(),
  };
}

export const errorBus = new ErrorBus();
