import { useEffect } from "react";
import { startCommunicationLayer } from "@/services/bootstrap";

/**
 * Muss genau einmal auf oberster Ebene der App gemountet werden.
 * Startet die WebSocket-/Store-Verdrahtung strikt client-seitig.
 */
export function useCommunicationLayer() {
  useEffect(() => {
    startCommunicationLayer();
  }, []);
}
