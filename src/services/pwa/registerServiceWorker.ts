/**
 * Service Worker cleanup.
 *
 * Aura Home currently favors always-fresh UI over offline shell caching. We
 * unregister existing `/sw.js` workers so stale app bundles cannot keep old
 * layouts alive after a server deploy.
 */
import { createLogger } from "@/services/logger/Logger";

const log = createLogger("pwa");

async function unregisterExisting(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      regs
        .filter((r) => (r.active?.scriptURL ?? "").endsWith("/sw.js"))
        .map((r) => r.unregister()),
    );
  } catch (err) {
    log.debug("unregister failed", err);
  }
}

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
  await unregisterExisting();
  void onUpdate;
  return null;
}

export async function unregisterServiceWorker(): Promise<void> {
  await unregisterExisting();
  handle.registration = null;
}

export function sendSwMessage(msg: unknown): void {
  if (typeof navigator === "undefined") return;
  navigator.serviceWorker?.controller?.postMessage(msg);
}
