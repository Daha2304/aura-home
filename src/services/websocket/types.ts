import type { WsIncomingEvent, WsOutgoingMessage } from "@/models/events";

export type WsEventHandler = (event: WsIncomingEvent) => void;
export type WsUnsubscribe = () => void;

export interface WsClientOptions {
  url: string;
  ssl?: boolean;
  token?: string;
  heartbeatMs?: number;
  reconnectMaxMs?: number;
}

export interface IWebSocketClient {
  readonly url: string;
  connect(): Promise<void>;
  disconnect(): void;
  send(message: WsOutgoingMessage): void;
  subscribe(topic: string): WsUnsubscribe;
  on(handler: WsEventHandler): WsUnsubscribe;
}
