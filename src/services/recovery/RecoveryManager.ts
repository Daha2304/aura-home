/**
 * RecoveryManager — koordiniert bestehende Selbstheilungs-Fähigkeiten.
 * Kein neuer Persistenzpfad, keine neue Business-Logik.
 */
import { createLogger } from "@/services/logger/Logger";
import { errorBus } from "@/services/errors/ErrorBus";
import { wsManager } from "@/services/websocket/WebSocketManager";
import { useConnectionStore } from "@/store/slices/connectionStore";
import { useOfflineStore } from "@/store/slices/offlineStore";
import { backgroundSync } from "@/services/offline";

const log = createLogger("recovery");

class RecoveryManager {
  private unsubs: Array<() => void> = [];
  private running = false;
  private lastAttempt = 0;

  start(): void {
    if (this.running) return;
    if (typeof window === "undefined") return;
    this.running = true;

    // Reagiere auf Netzwerk-/Auth-Fehler mit Reconnect (mit Backoff im WS-Manager).
    this.unsubs.push(
      errorBus.on("error", (p) => {
        if (p.kind === "network" || p.kind === "timeout") {
          this.tryReconnect("errorBus:" + p.kind);
        }
      }),
    );

    // Beim Online-Werden Command-Queue flushen (bestehendes System).
    let previousOnline = useOfflineStore.getState().online;
    this.unsubs.push(
      useOfflineStore.subscribe((s) => {
        if (!previousOnline && s.online) {
          log.info("network back online — triggering sync");
          void backgroundSync.triggerNow?.();
          this.tryReconnect("online");
        }
        previousOnline = s.online;
      }),
    );
  }

  stop(): void {
    for (const u of this.unsubs) u();
    this.unsubs = [];
    this.running = false;
  }

  private tryReconnect(reason: string): void {
    const now = Date.now();
    if (now - this.lastAttempt < 5000) return; // debouncen
    this.lastAttempt = now;
    const status = useConnectionStore.getState().status;
    if (status === "connected" || status === "connecting") return;
    log.info("attempting reconnect", reason);
    void wsManager.connect?.();
  }
}

export const recoveryManager = new RecoveryManager();
