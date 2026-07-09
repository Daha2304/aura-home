/**
 * UpdateManager — bridges Service Worker updates into the app UI.
 *
 * No business logic: reads only SW state, exposes soft/hard reload helpers,
 * and mirrors state into `updateStore`. Consumers subscribe to the store.
 */
import { createLogger } from "@/services/logger/Logger";
import { useUpdateStore } from "@/store/slices/updateStore";
import {
  getServiceWorkerHandle,
  registerServiceWorker,
  sendSwMessage,
} from "./registerServiceWorker";

const log = createLogger("pwa.update");

let started = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;
const POLL_INTERVAL_MS = 60 * 60 * 1000; // 1h

async function readWaitingVersion(): Promise<string | null> {
  const reg = getServiceWorkerHandle().registration;
  const target = reg?.waiting;
  if (!target) return null;
  return new Promise((resolve) => {
    const ch = new MessageChannel();
    ch.port1.onmessage = (e) => resolve(e.data?.version ?? null);
    try {
      target.postMessage({ type: "GET_VERSION" }, [ch.port2]);
      setTimeout(() => resolve(null), 500);
    } catch {
      resolve(null);
    }
  });
}

async function readCurrentVersion(): Promise<string | null> {
  if (typeof navigator === "undefined" || !navigator.serviceWorker?.controller) return null;
  return new Promise((resolve) => {
    const ch = new MessageChannel();
    ch.port1.onmessage = (e) => resolve(e.data?.version ?? null);
    try {
      navigator.serviceWorker.controller?.postMessage({ type: "GET_VERSION" }, [ch.port2]);
      setTimeout(() => resolve(null), 500);
    } catch {
      resolve(null);
    }
  });
}

export const updateManager = {
  async start(): Promise<void> {
    if (started) return;
    started = true;

    await registerServiceWorker(async (reg) => {
      const waiting = await readWaitingVersion();
      useUpdateStore.getState().setAvailable(true, waiting);
      log.info("update available", { waiting });
      void reg; // reserved
    });

    useUpdateStore.getState().setCurrentVersion(await readCurrentVersion());
    useUpdateStore.getState().setChecked();

    if (typeof window !== "undefined") {
      pollTimer = setInterval(() => void updateManager.checkForUpdate(), POLL_INTERVAL_MS);
    }
  },

  stop(): void {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
    started = false;
  },

  async checkForUpdate(): Promise<void> {
    const reg = getServiceWorkerHandle().registration;
    if (!reg) return;
    try {
      await reg.update();
      useUpdateStore.getState().setChecked();
    } catch (err) {
      log.debug("update check failed", err);
    }
  },

  async softReload(): Promise<void> {
    useUpdateStore.getState().setApplying(true);
    if (typeof window !== "undefined") window.location.reload();
  },

  async hardReload(): Promise<void> {
    useUpdateStore.getState().setApplying(true);
    const reg = getServiceWorkerHandle().registration;
    const waiting = reg?.waiting;
    if (waiting) {
      waiting.postMessage({ type: "SKIP_WAITING" });
      await new Promise<void>((resolve) => {
        if (typeof navigator === "undefined") return resolve();
        navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), {
          once: true,
        });
        setTimeout(resolve, 2000);
      });
    }
    // Ask SW to purge caches, then reload from network.
    await new Promise<void>((resolve) => {
      if (typeof navigator === "undefined" || !navigator.serviceWorker?.controller) return resolve();
      const ch = new MessageChannel();
      ch.port1.onmessage = () => resolve();
      try {
        navigator.serviceWorker.controller.postMessage({ type: "CLEAR_CACHES" }, [ch.port2]);
        setTimeout(resolve, 1500);
      } catch {
        resolve();
      }
    });
    if (typeof window !== "undefined") window.location.reload();
  },

  skipWaiting(): void {
    sendSwMessage({ type: "SKIP_WAITING" });
  },
};
