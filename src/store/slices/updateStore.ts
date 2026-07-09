import { create } from "zustand";

export interface ChangelogEntry {
  version: string;
  date: number;
  entries: string[];
}

interface UpdateState {
  available: boolean;
  applying: boolean;
  lastChecked: number | null;
  currentVersion: string | null;
  waitingVersion: string | null;
  changelog: ChangelogEntry[];
  setAvailable: (available: boolean, waitingVersion?: string | null) => void;
  setApplying: (v: boolean) => void;
  setChecked: () => void;
  setCurrentVersion: (v: string | null) => void;
  addChangelog: (entry: ChangelogEntry) => void;
}

export const useUpdateStore = create<UpdateState>((set) => ({
  available: false,
  applying: false,
  lastChecked: null,
  currentVersion: null,
  waitingVersion: null,
  changelog: [],
  setAvailable: (available, waitingVersion = null) => set({ available, waitingVersion }),
  setApplying: (applying) => set({ applying }),
  setChecked: () => set({ lastChecked: Date.now() }),
  setCurrentVersion: (v) => set({ currentVersion: v }),
  addChangelog: (entry) => set((s) => ({ changelog: [entry, ...s.changelog].slice(0, 50) })),
}));
