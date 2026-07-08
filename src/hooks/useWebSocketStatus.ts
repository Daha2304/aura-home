import { useConnectionStore } from "@/store/slices/connectionStore";

export function useWebSocketStatus() {
  const status = useConnectionStore((s) => s.status);
  const latencyMs = useConnectionStore((s) => s.latencyMs);
  const lastError = useConnectionStore((s) => s.lastError);
  return { status, latencyMs, lastError };
}
