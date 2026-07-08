import type { WsIncomingEvent, WsOutgoingMessage } from "@/models/events";
import type { ServerConfig } from "@/models/server";

/**
 * Protokoll-Adapter. Kapselt, WIE Nachrichten für einen konkreten Server
 * kodiert und dekodiert werden. Der WebSocketManager kennt nur dieses Interface —
 * das eigentliche Server-Protokoll kann später ausgetauscht werden,
 * ohne den Manager zu berühren.
 */
export interface Protocol {
  encode(message: WsOutgoingMessage): string | ArrayBufferLike | Blob;
  decode(raw: unknown): WsIncomingEvent | null;
  /**
   * Baut die Auth-Nachricht aus einer ServerConfig. Wird nach "open" gesendet,
   * wenn die Config eine Auth-Methode definiert.
   */
  buildAuthMessage(server: ServerConfig): WsOutgoingMessage | null;
  /** Erkennt, ob ein Incoming-Event ein Auth-Erfolg ist. */
  isAuthSuccess(event: WsIncomingEvent): boolean;
  /** Erkennt, ob ein Incoming-Event ein Auth-Fehlschlag ist. */
  isAuthFailure(event: WsIncomingEvent): boolean;
}

/**
 * Default-Protokoll: JSON mit `{ type, ...payload }`. Bewusst schmal —
 * echte serverseitige Feinheiten kommen später.
 * Die Auth-Nachricht ist als generisches `{ type: "auth", payload: {...} }`
 * ausgeformt und kann vom echten Server-Adapter überschrieben werden.
 */
export const defaultJsonProtocol: Protocol = {
  encode(message) {
    return JSON.stringify(message);
  },
  decode(raw) {
    if (typeof raw !== "string") return null;
    try {
      const parsed = JSON.parse(raw) as { type?: string } & Record<string, unknown>;
      if (!parsed || typeof parsed.type !== "string") return null;
      return parsed as unknown as WsIncomingEvent;
    } catch {
      return null;
    }
  },
  buildAuthMessage(server) {
    if (server.auth.type === "none") return null;
    const payload: Record<string, unknown> = { method: server.auth.type };
    if (server.auth.password) payload.password = server.auth.password;
    if (server.auth.token) payload.token = server.auth.token;
    if (server.auth.username) payload.username = server.auth.username;
    return { type: "auth", payload };
  },
  isAuthSuccess(event) {
    return event.type === "auth_ok";
  },
  isAuthFailure(event) {
    return event.type === "auth_failed";
  },
};
