import { create } from "zustand";
import type { LayoutBreakpoint } from "@/models/layout";
import type { WidgetInstanceId } from "@/models/widgetInstance";
import type { Guide } from "@/services/dashboards/editor/Guides";

export type EditorMode = "normal" | "edit";
export type ZoomLevel = 0.5 | 0.75 | 1 | 1.25 | 1.5;

interface EditorState {
  mode: EditorMode;
  activeBreakpoint: LayoutBreakpoint;
  zoom: ZoomLevel;
  showGrid: boolean;
  showGuides: boolean;
  showSpacing: boolean;
  snap: boolean;
  lockAspect: boolean;

  selection: Set<WidgetInstanceId>;
  hoverId: WidgetInstanceId | null;
  dragging: WidgetInstanceId | null;
  resizing: WidgetInstanceId | null;
  activeGuides: Guide[];

  toolboxOpen: boolean;
  propertiesOpen: boolean;

  historyTick: number;

  enterEdit: () => void;
  exitEdit: () => void;
  toggleMode: () => void;
  setBreakpoint: (bp: LayoutBreakpoint) => void;
  setZoom: (z: ZoomLevel) => void;
  toggleGrid: () => void;
  toggleGuides: () => void;
  toggleSpacing: () => void;
  toggleSnap: () => void;
  toggleLockAspect: () => void;

  select: (id: WidgetInstanceId | null) => void;
  toggleSelection: (id: WidgetInstanceId) => void;
  clearSelection: () => void;
  setHover: (id: WidgetInstanceId | null) => void;
  setDragging: (id: WidgetInstanceId | null) => void;
  setResizing: (id: WidgetInstanceId | null) => void;
  setGuides: (g: Guide[]) => void;

  setToolboxOpen: (v: boolean) => void;
  setPropertiesOpen: (v: boolean) => void;

  bumpHistory: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  mode: "normal",
  activeBreakpoint: "desktop",
  zoom: 1,
  showGrid: true,
  showGuides: true,
  showSpacing: false,
  snap: true,
  lockAspect: false,

  selection: new Set(),
  hoverId: null,
  dragging: null,
  resizing: null,
  activeGuides: [],

  toolboxOpen: false,
  propertiesOpen: false,

  historyTick: 0,

  enterEdit: () => set({ mode: "edit" }),
  exitEdit: () => set({ mode: "normal", selection: new Set(), toolboxOpen: false, propertiesOpen: false }),
  toggleMode: () => (get().mode === "edit" ? get().exitEdit() : get().enterEdit()),
  setBreakpoint: (activeBreakpoint) => set({ activeBreakpoint }),
  setZoom: (zoom) => set({ zoom }),
  toggleGrid: () => set({ showGrid: !get().showGrid }),
  toggleGuides: () => set({ showGuides: !get().showGuides }),
  toggleSpacing: () => set({ showSpacing: !get().showSpacing }),
  toggleSnap: () => set({ snap: !get().snap }),
  toggleLockAspect: () => set({ lockAspect: !get().lockAspect }),

  select: (id) => set({ selection: id ? new Set([id]) : new Set(), propertiesOpen: !!id }),
  toggleSelection: (id) => {
    const next = new Set(get().selection);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    set({ selection: next });
  },
  clearSelection: () => set({ selection: new Set(), propertiesOpen: false }),
  setHover: (hoverId) => set({ hoverId }),
  setDragging: (dragging) => set({ dragging }),
  setResizing: (resizing) => set({ resizing }),
  setGuides: (activeGuides) => set({ activeGuides }),

  setToolboxOpen: (toolboxOpen) => set({ toolboxOpen }),
  setPropertiesOpen: (propertiesOpen) => set({ propertiesOpen }),

  bumpHistory: () => set({ historyTick: get().historyTick + 1 }),
}));
