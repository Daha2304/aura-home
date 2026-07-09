import { create } from "zustand";
import type {
  TimelineEntry,
  TimelineFilter,
  TimelineSourceKind,
} from "@/models/timeline";
import type { Severity } from "@/models/severity";
import type { EventCategory } from "@/models/eventCategory";
import { SEVERITY_ORDER } from "@/models/severity";

const MAX_ENTRIES = 2000;

interface TimelineState {
  entries: TimelineEntry[];
  push: (entry: TimelineEntry) => void;
  pushMany: (entries: TimelineEntry[]) => void;
  clear: () => void;
  remove: (id: string) => void;
  update: (id: string, patch: Partial<TimelineEntry>) => void;
  setAcknowledged: (id: string, value: boolean) => void;
  setPinned: (id: string, value: boolean) => void;
  setArchived: (id: string, value: boolean) => void;
  query: (filter?: TimelineFilter) => TimelineEntry[];
}

function inList<T>(v: T | undefined, list: T | T[] | undefined): boolean {
  if (list === undefined) return true;
  if (v === undefined) return false;
  return Array.isArray(list) ? list.includes(v) : list === v;
}

function refMatches(entry: TimelineEntry, filter: TimelineFilter): boolean {
  if (filter.refId && entry.refId !== filter.refId) return false;
  const payload = entry.payload as
    | Record<string, unknown>
    | undefined
    | null;
  const pick = (k: string): string | undefined => {
    const v = payload && typeof payload === "object" ? payload[k] : undefined;
    return typeof v === "string" ? v : undefined;
  };
  if (filter.deviceId && entry.refId !== filter.deviceId && pick("deviceId") !== filter.deviceId) return false;
  if (filter.roomId && pick("roomId") !== filter.roomId) return false;
  if (filter.groupId && entry.refId !== filter.groupId && pick("groupId") !== filter.groupId) return false;
  if (filter.sceneId && entry.refId !== filter.sceneId && pick("sceneId") !== filter.sceneId) return false;
  if (filter.automationId && entry.refId !== filter.automationId && pick("automationId") !== filter.automationId) return false;
  return true;
}

function matchesFilter(entry: TimelineEntry, filter?: TimelineFilter): boolean {
  if (!filter) return true;
  if (!inList<TimelineSourceKind>(entry.source, filter.source)) return false;
  if (!inList<EventCategory>(entry.category, filter.category)) return false;
  if (!inList<Severity>(entry.severity, filter.severity)) return false;
  if (!inList<string>(entry.kind, filter.kind)) return false;
  if (filter.minSeverity && entry.severity && SEVERITY_ORDER[entry.severity] < SEVERITY_ORDER[filter.minSeverity]) return false;
  if (filter.since !== undefined && entry.timestamp < filter.since) return false;
  if (filter.until !== undefined && entry.timestamp > filter.until) return false;
  if (filter.acknowledged !== undefined && (entry.acknowledged ?? false) !== filter.acknowledged) return false;
  if (filter.pinned !== undefined && (entry.pinned ?? false) !== filter.pinned) return false;
  if (filter.archived !== undefined && (entry.archived ?? false) !== filter.archived) return false;
  if (!refMatches(entry, filter)) return false;
  if (filter.search) {
    const q = filter.search.toLowerCase();
    const hay = `${entry.title ?? ""} ${entry.detail ?? ""} ${entry.kind}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function insertSorted(list: TimelineEntry[], entry: TimelineEntry): TimelineEntry[] {
  // Ringpuffer, neueste zuerst.
  const out = [entry, ...list];
  if (out.length > MAX_ENTRIES) out.length = MAX_ENTRIES;
  return out;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  entries: [],
  push: (entry) =>
    set((s) => ({ entries: insertSorted(s.entries, entry) })),
  pushMany: (entries) =>
    set((s) => {
      let arr = s.entries;
      for (const e of entries) arr = insertSorted(arr, e);
      return { entries: arr };
    }),
  clear: () => set({ entries: [] }),
  remove: (id) =>
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
  update: (id, patch) =>
    set((s) => ({
      entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })),
  setAcknowledged: (id, value) => get().update(id, { acknowledged: value }),
  setPinned: (id, value) => get().update(id, { pinned: value }),
  setArchived: (id, value) => get().update(id, { archived: value }),
  query: (filter) => {
    const out = get().entries.filter((e) => matchesFilter(e, filter));
    if (filter?.limit) return out.slice(0, filter.limit);
    return out;
  },
}));
