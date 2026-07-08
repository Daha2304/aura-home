import { create } from "zustand";
import type { ConnectionStatus } from "@/models/events";

interface ConnectionState {
  status: ConnectionStatus;
  latencyMs?: number;
  lastError?: string;
  setStatus: (s: ConnectionStatus) => void;
  setLatency: (ms: number) => void;
  setError: (msg?: string) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  status: "idle",
  latencyMs: undefined,
  lastError: undefined,
  setStatus: (status) => set({ status }),
  setLatency: (latencyMs) => set({ latencyMs }),
  setError: (lastError) => set({ lastError }),
}));
