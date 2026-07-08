import type { ServerConfig } from "@/models/server";
import { AppError, type AppErrorPayload } from "@/services/errors/AppError";
import { TypedEmitter } from "@/services/events/EventEmitter";
import { wsManager } from "@/services/websocket/WebSocketManager";
import { discoveryEvents } from "@/services/discovery/DiscoveryEvents";
import { createLogger } from "@/services/logger/Logger";

const log = createLogger("onboarding");

export type OnboardingPhase =
  | "idle"
  | "connecting"
  | "authenticating"
  | "discovering"
  | "syncing"
  | "done"
  | "error";

export interface OnboardingPhaseStatus {
  phase: OnboardingPhase;
  message?: string;
  error?: AppErrorPayload;
}

interface ControllerEventMap {
  phase: OnboardingPhaseStatus;
  done: void;
  error: AppErrorPayload;
}

const PHASE_TIMEOUT = 15_000;

class OnboardingController extends TypedEmitter<ControllerEventMap> {
  private phase: OnboardingPhase = "idle";
  private unsubs: Array<() => void> = [];
  private aborted = false;
  private timeout: ReturnType<typeof setTimeout> | null = null;

  get currentPhase(): OnboardingPhase {
    return this.phase;
  }

  /**
   * Führt einen vollständigen Verbindungstest gegen `server` durch.
   * Konfiguriert dazu den zentralen wsManager temporär.
   */
  async runConnectionTest(server: ServerConfig): Promise<void> {
    this.abort();
    this.aborted = false;
    this.setPhase("connecting");

    // Manager mit Test-Konfiguration versorgen — echte Kommunikationsschicht.
    wsManager.configure({ server, debug: false });

    return new Promise<void>((resolve, reject) => {
      const fail = (err: AppError) => {
        this.armTimeout(0);
        this.cleanup();
        const payload = err.toPayload();
        this.setPhase("error", { error: payload });
        this.emit("error", payload);
        reject(err);
      };

      this.unsubs.push(
        wsManager.on("connected", () => {
          if (this.aborted) return;
          this.setPhase("authenticating");
          this.armTimeout(PHASE_TIMEOUT, "auth_timeout");
        }),
        wsManager.on("authenticated", () => {
          if (this.aborted) return;
          this.setPhase("discovering");
          this.armTimeout(PHASE_TIMEOUT, "discovery_timeout");
        }),
        wsManager.on("authentication_failed", ({ reason }) => {
          fail(
            new AppError("auth", reason ?? "Authentifizierung fehlgeschlagen", {
              code: "AUTH_FAILED",
            }),
          );
        }),
        wsManager.on("error", (payload) => {
          fail(
            new AppError(payload.kind, payload.message, {
              code: payload.code ?? "WS_ERROR",
              cause: payload.cause,
              context: payload.context,
            }),
          );
        }),
        wsManager.on("disconnected", ({ code, reason }) => {
          if (this.phase === "done" || this.aborted) return;
          fail(
            new AppError("network", reason || "Verbindung getrennt", {
              code: `WS_${code}`,
            }),
          );
        }),
        discoveryEvents.on("syncStarted", () => {
          if (this.aborted) return;
          this.setPhase("syncing");
          this.armTimeout(PHASE_TIMEOUT, "sync_timeout");
        }),
        discoveryEvents.on("syncFinished", () => {
          if (this.aborted) return;
          this.armTimeout(0);
          this.setPhase("done");
          this.cleanup();
          this.emit("done", undefined);
          resolve();
        }),
      );

      this.armTimeout(PHASE_TIMEOUT, "connect_timeout");

      wsManager.connect().catch((err) => {
        fail(
          err instanceof AppError
            ? err
            : new AppError("network", "Verbindung nicht möglich", {
                code: "NETWORK_UNREACHABLE",
                cause: err,
              }),
        );
      });
    });
  }

  abort(): void {
    this.aborted = true;
    this.armTimeout(0);
    this.cleanup();
    if (this.phase !== "idle" && this.phase !== "done") {
      wsManager.disconnect(4002, "onboarding_abort");
    }
    this.setPhase("idle");
  }

  private armTimeout(ms: number, code?: string): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    if (ms <= 0) return;
    this.timeout = setTimeout(() => {
      log.warn("phase timeout", this.phase, code);
      const err = new AppError(
        "timeout",
        `Zeitüberschreitung in Phase „${this.phase}“`,
        { code: code ?? "TIMEOUT" },
      );
      const payload = err.toPayload();
      this.setPhase("error", { error: payload });
      this.cleanup();
      wsManager.disconnect(4003, "onboarding_timeout");
      this.emit("error", payload);
    }, ms);
  }

  private setPhase(
    phase: OnboardingPhase,
    extra: Omit<OnboardingPhaseStatus, "phase"> = {},
  ): void {
    this.phase = phase;
    this.emit("phase", { phase, ...extra });
  }

  private cleanup(): void {
    for (const off of this.unsubs) off();
    this.unsubs = [];
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
}

export const onboardingController = new OnboardingController();
