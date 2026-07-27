import { createLogger } from "@/services/logger/Logger";

const log = createLogger("pwa");

export interface ServiceWorkerHandle {
  registration: ServiceWorkerRegistration | null;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
}

const handle: ServiceWorkerHandle = { registration: null };

export function getServiceWorkerHandle(): ServiceWorkerHandle {
  return handle;
}

export async function registerServiceWorker(
  onUpdate?: (r: ServiceWorkerRegistration) => void,
): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  if (typeof window === "undefined") return null;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    handle.registration = registration;
    handle.onUpdate = onUpdate;

    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          onUpdate?.(registration);
        }
      });
    });

    if (registration.waiting && navigator.serviceWorker.controller) {
      onUpdate?.(registration);
    }

    return registration;
  } catch (err) {
    log.debug("registration failed", err);
    return null;
  }
}

export async function unregisterServiceWorker(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      regs
        .filter((r) =>
          (r.active?.scriptURL ?? r.installing?.scriptURL ?? r.waiting?.scriptURL ?? "").endsWith(
            "/sw.js",
          ),
        )
        .map((r) => r.unregister()),
    );
  } catch (err) {
    log.debug("unregister failed", err);
  }
  handle.registration = null;
}

export function sendSwMessage(msg: unknown): void {
  if (typeof navigator === "undefined") return;
  navigator.serviceWorker?.controller?.postMessage(msg);
}
