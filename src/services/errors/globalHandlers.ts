/**
 * Globale Fehler-Handler — leiten Browser-Events an errorBus.
 * Idempotent registrierbar; benutzt bestehende Error-Architektur.
 */
import { errorBus } from "./ErrorBus";
import { AppError } from "./AppError";

let installed = false;

function toAppError(reason: unknown, mechanism: string): AppError {
  if (reason instanceof AppError) return reason;
  const message =
    reason instanceof Error
      ? reason.message
      : typeof reason === "string"
      ? reason
      : "Unbekannter globaler Fehler";
  return new AppError("unknown", message, {
    cause: reason,
    context: { mechanism },
  });
}

export function installGlobalErrorHandlers(): () => void {
  if (typeof window === "undefined") return () => {};
  if (installed) return () => {};
  installed = true;

  const onError = (ev: ErrorEvent) => {
    errorBus.report(toAppError(ev.error ?? ev.message, "window.onerror"), {
      filename: ev.filename,
      lineno: ev.lineno,
      colno: ev.colno,
    });
  };

  const onRejection = (ev: PromiseRejectionEvent) => {
    errorBus.report(toAppError(ev.reason, "unhandledrejection"));
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
    installed = false;
  };
}
