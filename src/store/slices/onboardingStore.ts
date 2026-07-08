import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ServerDraft } from "@/models/server";
import type { AppErrorPayload } from "@/services/errors/AppError";

export type OnboardingFlow = "first-run" | "add-server" | null;

interface OnboardingState {
  completed: boolean;
  flow: OnboardingFlow;
  draftServer: ServerDraft | null;
  lastError: AppErrorPayload | null;

  startFirstRun: () => void;
  startAddServer: () => void;
  setDraft: (d: ServerDraft | null) => void;
  patchDraft: (patch: ServerDraft) => void;
  setError: (e: AppErrorPayload | null) => void;
  complete: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      completed: false,
      flow: null,
      draftServer: null,
      lastError: null,

      startFirstRun: () =>
        set({ flow: "first-run", draftServer: null, lastError: null }),
      startAddServer: () =>
        set({ flow: "add-server", draftServer: null, lastError: null }),
      setDraft: (draftServer) => set({ draftServer }),
      patchDraft: (patch) =>
        set({
          draftServer: {
            ...(get().draftServer ?? {}),
            ...patch,
            auth: { ...(get().draftServer?.auth ?? {}), ...(patch.auth ?? {}) },
          },
        }),
      setError: (lastError) => set({ lastError }),
      complete: () =>
        set({ completed: true, flow: null, draftServer: null, lastError: null }),
      reset: () =>
        set({
          completed: false,
          flow: null,
          draftServer: null,
          lastError: null,
        }),
    }),
    {
      name: "smarthome.onboarding",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ completed: s.completed }),
    },
  ),
);
