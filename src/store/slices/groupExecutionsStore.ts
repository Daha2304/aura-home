import { create } from "zustand";

/**
 * Live status of the last group action per group id. Fine-grained
 * command state itself lives in `useCommandsStore` — this store only
 * tracks per-group correlation and progress counters.
 */
export interface GroupExecutionState {
  groupId: string;
  correlationId: string;
  capabilityId: string;
  total: number;
  completed: number;
  failed: number;
  startedAt: number;
  finishedAt?: number;
  status: "running" | "succeeded" | "partial" | "failed";
}

interface GroupExecutionsState {
  byGroup: Record<string, GroupExecutionState>;
  byCorrelation: Record<string, string>; // correlationId -> groupId
  start: (e: GroupExecutionState) => void;
  progress: (correlationId: string, delta: { completed?: number; failed?: number }) => void;
  clear: (groupId: string) => void;
}

export const useGroupExecutionsStore = create<GroupExecutionsState>((set, get) => ({
  byGroup: {},
  byCorrelation: {},

  start: (e) =>
    set({
      byGroup: { ...get().byGroup, [e.groupId]: e },
      byCorrelation: { ...get().byCorrelation, [e.correlationId]: e.groupId },
    }),

  progress: (correlationId, delta) => {
    const groupId = get().byCorrelation[correlationId];
    if (!groupId) return;
    const cur = get().byGroup[groupId];
    if (!cur) return;
    const next: GroupExecutionState = {
      ...cur,
      completed: cur.completed + (delta.completed ?? 0),
      failed: cur.failed + (delta.failed ?? 0),
    };
    if (next.completed + next.failed >= next.total) {
      next.finishedAt = Date.now();
      next.status = next.failed === 0
        ? "succeeded"
        : next.completed === 0
          ? "failed"
          : "partial";
    }
    set({ byGroup: { ...get().byGroup, [groupId]: next } });
  },

  clear: (groupId) => {
    const { [groupId]: _drop, ...rest } = get().byGroup;
    void _drop;
    set({ byGroup: rest });
  },
}));
