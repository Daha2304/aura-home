/**
 * BackgroundSync — coordinates re-sync triggers only.
 *
 * Runs in the app thread. The service worker never contains business logic;
 * it merely relays 'sync' events back via postMessage.
 */
import { createLogger } from "@/services/logger/Logger";
import { wsManager } from "@/services/websocket/WebSocketManager";
import { getServiceWorkerHandle } from "@/services/pwa";
import { useOfflineStore } from "@/store/slices/offlineStore";

const log = createLogger("offline.sync");

export interface DeltaSyncDescriptor {
  id: string;
  label: string;
  since?: () => number | null;
  run(): Promise<void>;
}

class DeltaSyncRegistry {
  private readonly entries = new Map<string, DeltaSyncDescriptor>();
  register(d: DeltaSyncDescriptor): () => void {
    this.entries.set(d.id, d);
    return () => this.entries.delete(d.id);
  }
  list(): DeltaSyncDescriptor[] {
    return Array.from(this.entries.values());
  }
}

export const deltaSyncRegistry = new DeltaSyncRegistry();

let started = false;
const cleanups: Array<() => void> = [];

async function flush(reason: string): Promise<void> {
  const store = useOfflineStore.getState();
  if (store.syncing) return;
  store.setSyncing(true);
  log.info("sync flush", reason);
  try {
    // Trigger existing communication layer to reconnect + drain.
    if (!wsManager.isConnected?.()) {
      await wsManager.connect().catch(() => {});
    }
    // Delta sync providers (opt-in). No-op when empty.
    for (const d of deltaSyncRegistry.list()) {
      try { await d.run(); } catch (err) { log.debug("delta sync failed", d.id, err); }
    }
  } finally {
    useOfflineStore.getState().markSynced();
  }
}

export const backgroundSync = {
  async start(): Promise<void> {
    if (started || typeof window === "undefined") return;
    started = true;

    const onVisible = () => {
      if (document.visibilityState === "visible") void flush("visible");
    };
    const onOnline = () => void flush("online");
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    cleanups.push(() => document.removeEventListener("visibilitychange", onVisible));
    cleanups.push(() => window.removeEventListener("online", onOnline));

    // Message from SW background 'sync' event.
    if ("serviceWorker" in navigator) {
      const handler = (event: MessageEvent) => {
        if (event.data?.type === "BACKGROUND_SYNC") void flush("sw-sync");
      };
      navigator.serviceWorker.addEventListener("message", handler);
      cleanups.push(() =>
        navigator.serviceWorker.removeEventListener("message", handler),
      );

      // Register periodic sync tag (best-effort; not supported everywhere).
      try {
        const reg = getServiceWorkerHandle().registration;
        // @ts-expect-error — SyncManager not in default TS lib
        if (reg?.sync?.register) await reg.sync.register("smarthome-queue-flush");
      } catch { /* ignore */ }
    }
  },

  stop(): void {
    for (const c of cleanups) c();
    cleanups.length = 0;
    started = false;
  },

  triggerNow(): Promise<void> {
    return flush("manual");
  },
};
