import type { ConnectionStatus, WsIncomingEvent, WsOutgoingMessage } from "@/models/events";
import { buildServerUrl } from "@/models/server";
import { AppError } from "@/services/errors/AppError";
import { errorBus } from "@/services/errors/ErrorBus";
import { TypedEmitter } from "@/services/events/EventEmitter";
import { createLogger } from "@/services/logger/Logger";
import { MessageDispatcher } from "./dispatcher";
import { createHeartbeat, type Heartbeat } from "./heartbeat";
import { defaultJsonProtocol, type Protocol } from "./protocol";
import { createOutgoingQueue, type OutgoingQueue } from "./queue";
import { createExponentialBackoff, type ReconnectStrategy } from "./reconnect";
import { createSubscriptionRegistry, type SubscriptionRegistry } from "./subscriptions";
import type { IWebSocketManager, WsClientOptions, WsManagerEventMap, WsUnsubscribe } from "./types";

const log = createLogger("ws");

const DEFAULTS = {
  heartbeatIntervalMs: 15_000,
  heartbeatTimeoutMs: 5_000,
  reconnectBaseMs: 750,
  reconnectMaxMs: 20_000,
  reconnectMaxAttempts: Infinity,
  connectTimeoutMs: 10_000,
};

/**
 * Zentraler WebSocket-Manager.
 *
 * Kein UI-Code darf jemals `new WebSocket` benutzen — Kommunikation läuft
 * ausschließlich über diese Klasse und den {@link MessageDispatcher}.
 */
export class WebSocketManager extends TypedEmitter<WsManagerEventMap> implements IWebSocketManager {
  readonly dispatcher = new MessageDispatcher();

  private options: WsClientOptions | null = null;
  private protocol: Protocol = defaultJsonProtocol;
  private socket: WebSocket | null = null;
  private _status: ConnectionStatus = "idle";

  private readonly queue: OutgoingQueue = createOutgoingQueue();
  private readonly subs: SubscriptionRegistry = createSubscriptionRegistry();
  private readonly backoff: ReconnectStrategy = createExponentialBackoff(
    DEFAULTS.reconnectBaseMs,
    DEFAULTS.reconnectMaxMs,
  );
  private heartbeat: Heartbeat | null = null;

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectTimeout: ReturnType<typeof setTimeout> | null = null;
  private manualClose = false;

  get status(): ConnectionStatus {
    return this._status;
  }

  configure(options: WsClientOptions): void {
    this.options = options;
    log.setLevel(options.debug ? "debug" : "info");
  }

  setProtocol(protocol: Protocol): void {
    this.protocol = protocol;
  }

  async connect(): Promise<void> {
    if (!this.options) {
      throw new AppError("invalid_message", "WebSocketManager not configured");
    }
    if (this._status === "connected" || this._status === "connecting") return;

    this.manualClose = false;
    this.setStatus("connecting");

    const url = buildServerUrl(this.options.server);
    log.info("connecting", url);

    try {
      const socket = new WebSocket(url);
      this.socket = socket;

      const timeoutMs = this.options.connectTimeoutMs ?? DEFAULTS.connectTimeoutMs;
      this.connectTimeout = setTimeout(() => {
        if (this._status === "connecting") {
          log.warn("connect timeout");
          errorBus.report(new AppError("timeout", "Verbindungs-Timeout", { context: { url } }));
          this.forceClose(4000, "connect_timeout");
        }
      }, timeoutMs);

      socket.onopen = () => this.handleOpen();
      socket.onmessage = (ev) => this.handleMessage(ev.data);
      socket.onerror = () => this.handleError();
      socket.onclose = (ev) => this.handleClose(ev.code, ev.reason);
    } catch (err) {
      const payload = errorBus.report(
        new AppError("network", "WebSocket konnte nicht geöffnet werden", {
          cause: err,
        }),
      );
      this.emit("error", payload);
      this.setStatus("error");
      this.scheduleReconnect();
    }
  }

  disconnect(code = 1000, reason = "client_disconnect"): void {
    this.manualClose = true;
    this.clearTimers();
    this.backoff.reset();
    this.forceClose(code, reason);
    this.setStatus("disconnected");
  }

  async reconnect(): Promise<void> {
    this.forceClose(4001, "manual_reconnect");
    this.backoff.reset();
    await this.connect();
  }

  send(message: WsOutgoingMessage): void {
    if (this.canTransmit()) {
      this.transmit(message);
    } else {
      this.queue.enqueue(message);
      log.debug("queued (offline)", message.type, "size=", this.queue.size());
    }
  }

  subscribe(topic: string): WsUnsubscribe {
    if (this.subs.add(topic)) {
      this.send({ type: "subscribe", topic });
    }
    return () => {
      if (this.subs.remove(topic)) {
        this.send({ type: "unsubscribe", topic });
      }
    };
  }

  // ---------- internals ----------

  private canTransmit(): boolean {
    return (
      this.socket?.readyState === WebSocket.OPEN &&
      (this._status === "connected" || this._status === "authenticated")
    );
  }

  private transmit(message: WsOutgoingMessage): void {
    try {
      const encoded = this.protocol.encode(message);
      this.socket!.send(encoded as string);
      this.emit("sent", message);
    } catch (err) {
      errorBus.report(
        new AppError("parse", "Nachricht konnte nicht kodiert werden", {
          cause: err,
          context: { type: message.type },
        }),
      );
    }
  }

  private handleOpen(): void {
    if (this.connectTimeout) {
      clearTimeout(this.connectTimeout);
      this.connectTimeout = null;
    }
    this.backoff.reset();
    this.setStatus("connected");
    this.emit("connected", undefined);
    log.info("open");

    this.startHeartbeat();
    this.authenticateOrFlush();
  }

  private authenticateOrFlush(): void {
    if (!this.options) return;
    const authMsg = this.protocol.buildAuthMessage(this.options.server);
    if (authMsg) {
      this.setStatus("authenticating");
      this.transmit(authMsg);
      return;
    }
    this.flushQueueAndResubscribe();
  }

  private flushQueueAndResubscribe(): void {
    // Alle Subscriptions nach Reconnect erneut anmelden.
    for (const topic of this.subs.all()) {
      this.transmit({ type: "subscribe", topic });
    }
    this.queue.flush((msg) => this.transmit(msg));
  }

  private handleMessage(raw: unknown): void {
    this.emit("raw", raw);
    const event = this.protocol.decode(raw);
    if (!event) {
      errorBus.report(
        new AppError("invalid_message", "Unlesbare Nachricht empfangen", {
          context: { raw: typeof raw === "string" ? raw.slice(0, 200) : typeof raw },
        }),
      );
      return;
    }

    if (event.type === "pong") {
      this.heartbeat?.ack();
      const latency = this.heartbeat?.latencyMs();
      if (typeof latency === "number") this.emit("heartbeat", { latencyMs: latency });
      return;
    }
    if (event.type === "noop") {
      return;
    }

    if (this.protocol.isAuthSuccess(event)) {
      this.setStatus("authenticated");
      this.emit("authenticated", undefined);
      this.flushQueueAndResubscribe();
      return;
    }
    if (this.protocol.isAuthFailure(event)) {
      const reason = event.type === "auth_failed" ? event.reason : undefined;
      this.emit("authentication_failed", { reason });
      errorBus.report(
        new AppError("auth", "Authentifizierung fehlgeschlagen", {
          context: { reason },
        }),
      );
      this.disconnect(4010, "auth_failed");
      return;
    }
    if (event.type === "error") {
      errorBus.report(new AppError("server", event.message, { code: event.code }));
    }

    this.emit("message", event);
    this.dispatcher.dispatch(event as WsIncomingEvent);
  }

  private handleError(): void {
    const payload = errorBus.report(new AppError("network", "WebSocket-Fehler"));
    this.emit("error", payload);
  }

  private handleClose(code?: number, reason?: string): void {
    log.info("close", code, reason);
    this.stopHeartbeat();
    this.socket = null;
    this.emit("disconnected", { code, reason });

    if (this.manualClose) {
      this.setStatus("disconnected");
      return;
    }
    this.setStatus("reconnecting");
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (!this.options) return;
    const maxAttempts = this.options.reconnectMaxAttempts ?? DEFAULTS.reconnectMaxAttempts;
    if (this.backoff.attempts() >= maxAttempts) {
      log.warn("reconnect: max attempts reached");
      this.setStatus("error");
      return;
    }
    const delay = this.backoff.nextDelay();
    this.emit("reconnecting", { attempt: this.backoff.attempts(), delayMs: delay });
    log.info(`reconnect in ${Math.round(delay)}ms`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    if (!this.options) return;
    this.stopHeartbeat();
    const intervalMs = this.options.heartbeatIntervalMs ?? DEFAULTS.heartbeatIntervalMs;
    const timeoutMs = this.options.heartbeatTimeoutMs ?? DEFAULTS.heartbeatTimeoutMs;
    this.heartbeat = createHeartbeat({
      intervalMs,
      timeoutMs,
      onBeat: () => this.transmit({ type: "ping", ts: Date.now() }),
      onTimeout: () => {
        log.warn("heartbeat timeout");
        errorBus.report(new AppError("timeout", "Heartbeat-Timeout"));
        this.forceClose(4002, "heartbeat_timeout");
      },
    });
    this.heartbeat.start();
  }

  private stopHeartbeat(): void {
    this.heartbeat?.stop();
    this.heartbeat = null;
  }

  private forceClose(code: number, reason: string): void {
    try {
      this.socket?.close(code, reason);
    } catch {
      /* ignore */
    }
    this.socket = null;
    this.stopHeartbeat();
    this.clearTimers();
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.connectTimeout) {
      clearTimeout(this.connectTimeout);
      this.connectTimeout = null;
    }
  }

  private setStatus(next: ConnectionStatus): void {
    if (this._status === next) return;
    this._status = next;
    this.emit("status", next);
  }
}

/** Singleton — die gesamte App teilt sich exakt einen Manager. */
export const wsManager = new WebSocketManager();
