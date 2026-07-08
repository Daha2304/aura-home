import { create } from "zustand";

export type DevLogKind =
  | "connect"
  | "open"
  | "close"
  | "error"
  | "auth"
  | "auth_failed"
  | "reconnect"
  | "heartbeat"
  | "ping"
  | "pong"
  | "send"
  | "recv"
  | "info";

export interface DevLogEntry {
  id: number;
  ts: number;
  kind: DevLogKind;
  message: string;
  detail?: string;
}

interface DevLogState {
  entries: DevLogEntry[];
  paused: boolean;
  maxEntries: number;
  push: (e: Omit<DevLogEntry, "id" | "ts"> & { ts?: number }) => void;
  clear: () => void;
  setPaused: (v: boolean) => void;
}

let seq = 0;
const MAX = 500;

export const useDevLogStore = create<DevLogState>((set, get) => ({
  entries: [],
  paused: false,
  maxEntries: MAX,
  push: (e) => {
    if (get().paused) return;
    const entry: DevLogEntry = {
      id: ++seq,
      ts: e.ts ?? Date.now(),
      kind: e.kind,
      message: e.message,
      detail: e.detail,
    };
    set((s) => {
      const next = s.entries.length >= s.maxEntries
        ? [...s.entries.slice(s.entries.length - s.maxEntries + 1), entry]
        : [...s.entries, entry];
      return { entries: next };
    });
  },
  clear: () => set({ entries: [] }),
  setPaused: (paused) => set({ paused }),
}));

export function devLog(kind: DevLogKind, message: string, detail?: unknown) {
  let d: string | undefined;
  if (detail !== undefined) {
    try {
      d = typeof detail === "string" ? detail : JSON.stringify(detail);
    } catch {
      d = String(detail);
    }
    if (d && d.length > 2000) d = d.slice(0, 2000) + "…";
  }
  useDevLogStore.getState().push({ kind, message, detail: d });
}
