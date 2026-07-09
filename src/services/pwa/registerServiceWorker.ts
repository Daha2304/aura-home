/**
 * Guarded Service Worker registration.
 *
 * Registers ONLY in production and outside any Lovable preview / iframe context.
 * In dev / preview / iframe / `?sw=off`, existing /sw.js registrations are removed
 * so stale caches from a previous production visit cannot leak.
 */
import { createLogger } from "@/services/logger/Logger";

const log = createLogger("pwa");

function isRefused(): boolean {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.PROD) return true;
  if (window.self !== window.top) return true;
  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  if (new URL(window.location.href).searchParams.get("sw") === "off") return true;
  return false;
}

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
  if (isRefused()) {
    await unregisterExisting();
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    handle.registration = reg;
    handle.onUpdate = onUpdate;
    reg.addEventListener("updatefound", () => {
      const nw = reg.installing;
      if (!nw) return;
      nw.addEventListener("statechange", () => {
        if (nw.state === "installed" && navigator.serviceWorker.controller) {
          onUpdate?.(reg);
        }
      });
    });
    log.info("service worker registered");
    return reg;
  } catch (err) {
    log.warn("service worker registration failed", err);
    return null;
  }
}

export async function unregisterServiceWorker(): Promise<void> {
  await unregisterExisting();
  handle.registration = null;
}

export function sendSwMessage(msg: unknown): void {
  if (typeof navigator === "undefined") return;
  navigator.serviceWorker?.controller?.postMessage(msg);
}
