import type { WsOutgoingMessage } from "@/models/events";

export interface OutgoingQueue {
  enqueue(msg: WsOutgoingMessage): void;
  flush(send: (msg: WsOutgoingMessage) => void): void;
  clear(): void;
  size(): number;
}

export function createOutgoingQueue(): OutgoingQueue {
  const buffer: WsOutgoingMessage[] = [];
  return {
    enqueue(msg) {
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
  };
}
