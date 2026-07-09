/**
 * logStore — bounded UI mirror of the logger ring buffer.
 * Populated via addLogSink() in bootstrap. No parallel logging pipeline.
 */
import { create } from "zustand";
import type { LogEntry, LogLevel } from "@/services/logger/Logger";

const MAX_ENTRIES = 500;

interface LogState {
  entries: LogEntry[];
  push: (entry: LogEntry) => void;
  clear: () => void;
}

export const useLogStore = create<LogState>((set) => ({
  entries: [],
  push: (entry) =>
    set((s) => {
      const next = s.entries.length >= MAX_ENTRIES
        ? [...s.entries.slice(-(MAX_ENTRIES - 1)), entry]
        : [...s.entries, entry];
      return { entries: next };
    }),
  clear: () => set({ entries: [] }),
}));

export type LogFilter = {
  levels?: Set<Exclude<LogLevel, "silent">>;
  scope?: string;
};

export function filterLogs(entries: LogEntry[], filter: LogFilter): LogEntry[] {
  return entries.filter((e) => {
    if (filter.levels && !filter.levels.has(e.level)) return false;
    if (filter.scope && !e.scope.includes(filter.scope)) return false;
    return true;
  });
}

export function serializeLogs(entries: LogEntry[]): string {
  return entries
    .map((e) => {
      const ts = new Date(e.ts).toISOString();
      return `${ts} [${e.level.toUpperCase()}] [${e.scope}] ${e.message}`;
    })
    .join("\n");
}
