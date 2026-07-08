import type {
  ConnectionStatus,
  WsIncomingEvent,
  WsOutgoingMessage,
} from "@/models/events";
import type { ServerConfig } from "@/models/server";
import type { AppErrorPayload } from "@/services/errors/AppError";

export type WsUnsubscribe = () => void;
export type WsEventHandler = (event: WsIncomingEvent) => void;

/**
 * Alle Events, die der WebSocketManager emittiert.
 * UI-Komponenten und Manager hören ausschließlich diese Events —
 * niemals direkt das native WebSocket-Objekt.
 */
export interface WsManagerEventMap {
  status: ConnectionStatus;
  connected: void;
  disconnected: { code?: number; reason?: string };
  authenticated: void;
  authentication_failed: { reason?: string };
  message: WsIncomingEvent;
  raw: unknown;
  sent: WsOutgoingMessage;
  heartbeat: { latencyMs: number };
  error: AppErrorPayload;
  reconnecting: { attempt: number; delayMs: number };
}

export interface WsClientOptions {
  server: ServerConfig;
  heartbeatIntervalMs?: number;
  heartbeatTimeoutMs?: number;
  reconnectBaseMs?: number;
  reconnectMaxMs?: number;
  reconnectMaxAttempts?: number;
  connectTimeoutMs?: number;
  debug?: boolean;
}

export interface IWebSocketManager {
  readonly status: ConnectionStatus;
  configure(options: WsClientOptions): void;
  connect(): Promise<void>;
  disconnect(code?: number, reason?: string): void;
  reconnect(): Promise<void>;
  send(message: WsOutgoingMessage): void;
  subscribe(topic: string): WsUnsubscribe;
}
