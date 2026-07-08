import { create } from "zustand";
import type { ID } from "@/models/common";
import type { AssignmentInput } from "@/services/intelligence/assignment/DeviceAssignmentEngine";

export interface PendingAssignment extends AssignmentInput {
  deviceId: ID;
  requestedAt: number;
}

interface AssignmentState {
  pending: PendingAssignment[];
  enqueue: (a: PendingAssignment) => void;
  clear: (deviceId: ID) => void;
  reset: () => void;
}

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  pending: [],
  enqueue: (a) => set({ pending: [...get().pending.filter((p) => p.deviceId !== a.deviceId), a] }),
  clear: (deviceId) => set({ pending: get().pending.filter((p) => p.deviceId !== deviceId) }),
  reset: () => set({ pending: [] }),
}));
