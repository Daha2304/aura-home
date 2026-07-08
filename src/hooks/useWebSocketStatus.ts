import { useConnectionStore } from "@/store/slices/connectionStore";
import { wsManager } from "@/services/websocket/WebSocketManager";

/**
 * Lese-Hook für UI-Komponenten. UI kennt nur den Store — keine direkte
 * Referenz auf die WebSocket-Instanz.
 */
export function useWebSocketStatus() {
  const status = useConnectionStore((s) => s.status);
  const latencyMs = useConnectionStore((s) => s.latencyMs);
  const lastError = useConnectionStore((s) => s.lastError);
  const authenticated = useConnectionStore((s) => s.authenticated);
  const reconnectAttempt = useConnectionStore((s) => s.reconnectAttempt);
  return { status, latencyMs, lastError, authenticated, reconnectAttempt };
}

/** Aktionen — bewusst getrennt, damit Lese-Komponenten nicht re-rendern. */
export function useWebSocketActions() {
  return {
    connect: () => wsManager.connect(),
    disconnect: () => wsManager.disconnect(),
    reconnect: () => wsManager.reconnect(),
  };
}
