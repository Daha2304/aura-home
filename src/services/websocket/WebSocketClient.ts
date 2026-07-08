import type { WsOutgoingMessage } from "@/models/events";
import type {
  IWebSocketClient,
  WsClientOptions,
  WsEventHandler,
  WsUnsubscribe,
} from "./types";
import { createExponentialBackoff } from "./reconnect";
import { createHeartbeat } from "./heartbeat";
import { createOutgoingQueue } from "./queue";
import { createSubscriptionRegistry } from "./subscriptions";

/**
 * WebSocket client scaffold.
 * The transport is intentionally NOT implemented in this scaffold —
 * calls to network-effecting methods throw NotImplemented. Only structure,
 * options, and internal collaborators are wired up.
 */
export class WebSocketClient implements IWebSocketClient {
  readonly url: string;
  private readonly options: WsClientOptions;
  private readonly backoff = createExponentialBackoff();
  private readonly queue = createOutgoingQueue();
  private readonly subscriptions = createSubscriptionRegistry();
  private readonly handlers = new Set<WsEventHandler>();
  private readonly heartbeat = createHeartbeat(15_000, () => {
    /* onTimeout handler wired in real impl */
  });

  constructor(options: WsClientOptions) {
    this.options = options;
    this.url = options.url;
  }

  async connect(): Promise<void> {
    throw new Error(
      "WebSocketClient.connect is not implemented yet in this scaffold.",
    );
  }

  disconnect(): void {
    this.heartbeat.stop();
    this.queue.clear();
    this.backoff.reset();
  }

  send(message: WsOutgoingMessage): void {
    // In real impl: if connected, transmit; otherwise enqueue.
    this.queue.enqueue(message);
  }

  subscribe(topic: string): WsUnsubscribe {
    this.subscriptions.add(topic);
    return () => this.subscriptions.remove(topic);
  }

  on(handler: WsEventHandler): WsUnsubscribe {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
}
