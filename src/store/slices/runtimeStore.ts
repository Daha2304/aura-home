import { create } from "zustand";
import type { DashboardId } from "@/models/dashboard";
import type { LayoutBreakpoint } from "@/models/layout";
import type { RuntimeOverlayId } from "@/services/runtime/RuntimeEvents";

interface RuntimeState {
  activeDashboardId: DashboardId | null;
  breakpoint: LayoutBreakpoint;
  theme: "light" | "dark" | "auto";
  effectiveTheme: "light" | "dark";
  overlays: RuntimeOverlayId[];

  setActiveDashboard: (id: DashboardId | null) => void;
  setBreakpoint: (bp: LayoutBreakpoint) => void;
  setTheme: (t: "light" | "dark" | "auto") => void;
  setEffectiveTheme: (t: "light" | "dark") => void;
  setOverlays: (ids: RuntimeOverlayId[]) => void;
}

export const useRuntimeStore = create<RuntimeState>((set) => ({
  activeDashboardId: null,
  breakpoint: "desktop",
  theme: "auto",
  effectiveTheme: "light",
  overlays: [],

  setActiveDashboard: (activeDashboardId) => set({ activeDashboardId }),
  setBreakpoint: (breakpoint) => set({ breakpoint }),
  setTheme: (theme) => set({ theme }),
  setEffectiveTheme: (effectiveTheme) => set({ effectiveTheme }),
  setOverlays: (overlays) => set({ overlays }),
}));
