import type { WsOutgoingMessage } from "@/models/events";

export interface OutgoingQueue {
  enqueue(msg: WsOutgoingMessage): void;
  flush(send: (msg: WsOutgoingMessage) => void): void;
  clear(): void;
  size(): number;
  peek(): WsOutgoingMessage[];
}

/**
 * FIFO-Queue für ausgehende Nachrichten, solange keine Verbindung besteht.
 * Priorisierung ist bewusst nicht enthalten — die Reihenfolge der Aufrufe zählt.
 */
export function createOutgoingQueue(maxSize = 500): OutgoingQueue {
  const buffer: WsOutgoingMessage[] = [];
  return {
    enqueue(msg) {
      if (buffer.length >= maxSize) buffer.shift();
      buffer.push(msg);
    },
    flush(send) {
      while (buffer.length > 0) {
        const msg = buffer.shift();
        if (msg) send(msg);
      }
    },
    clear() {
      buffer.length = 0;
    },
    size() {
      return buffer.length;
    },
    peek() {
      return [...buffer];
    },
  };
}
