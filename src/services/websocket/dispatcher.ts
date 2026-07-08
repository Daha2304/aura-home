import type { WsIncomingEvent } from "@/models/events";
import { createLogger } from "@/services/logger/Logger";

export type MessageHandler<E extends WsIncomingEvent = WsIncomingEvent> = (
  event: E,
) => void;

type AnyHandler = MessageHandler<WsIncomingEvent>;

const log = createLogger("dispatcher");

/**
 * Zentraler Message-Dispatcher.
 *
 * - Alle eingehenden Server-Nachrichten laufen durch dispatch().
 * - Beliebig viele Handler pro Nachrichten-Typ.
 * - "*"-Handler bekommen jede Nachricht.
 * - Handler dürfen throwen; der Dispatcher kapselt den Fehler.
 */
export class MessageDispatcher {
  private readonly byType = new Map<string, Set<AnyHandler>>();
  private readonly wildcards = new Set<AnyHandler>();

  on<T extends WsIncomingEvent["type"]>(
    type: T,
    handler: MessageHandler<Extract<WsIncomingEvent, { type: T }>>,
  ): () => void {
    let set = this.byType.get(type);
    if (!set) {
      set = new Set();
      this.byType.set(type, set);
    }
    set.add(handler as AnyHandler);
    return () => set!.delete(handler as AnyHandler);
  }

  onAny(handler: AnyHandler): () => void {
    this.wildcards.add(handler);
    return () => this.wildcards.delete(handler);
  }

  dispatch(event: WsIncomingEvent): void {
    const handlers = this.byType.get(event.type);
    if (handlers) {
      for (const h of Array.from(handlers)) {
        try {
          h(event);
        } catch (err) {
          log.error("handler failed", event.type, err);
        }
      }
    }
    for (const h of Array.from(this.wildcards)) {
      try {
        h(event);
      } catch (err) {
        log.error("wildcard handler failed", event.type, err);
      }
    }
  }

  clear(): void {
    this.byType.clear();
    this.wildcards.clear();
  }
}
