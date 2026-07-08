import { create } from "zustand";
import type { ConnectionStatus } from "@/models/events";

interface ConnectionState {
  status: ConnectionStatus;
  latencyMs?: number;
  lastError?: string;
  lastConnectedAt?: number;
  reconnectAttempt: number;
  authenticated: boolean;
  setStatus: (s: ConnectionStatus) => void;
  setLatency: (ms: number) => void;
  setError: (msg?: string) => void;
  setReconnectAttempt: (n: number) => void;
  setAuthenticated: (v: boolean) => void;
  markConnected: () => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  status: "idle",
  latencyMs: undefined,
  lastError: undefined,
  lastConnectedAt: undefined,
  reconnectAttempt: 0,
  authenticated: false,
  setStatus: (status) => set({ status }),
  setLatency: (latencyMs) => set({ latencyMs }),
  setError: (lastError) => set({ lastError }),
  setReconnectAttempt: (reconnectAttempt) => set({ reconnectAttempt }),
  setAuthenticated: (authenticated) => set({ authenticated }),
  markConnected: () => set({ lastConnectedAt: Date.now(), reconnectAttempt: 0 }),
}));
