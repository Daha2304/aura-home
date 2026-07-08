import { useEffect } from "react";
import { useEditorStore } from "@/store/slices/editorStore";
import { useDashboardsStore } from "@/store/slices/dashboardsStore";
import { useWidgetInstancesStore } from "@/store/slices/widgetInstancesStore";
import { useLayoutsStore } from "@/store/slices/layoutsStore";
import { useWidgetRegistryStore } from "@/store/slices/widgetRegistryStore";
import { widgetManager } from "@/services/widgets/WidgetManager";
import { dashboardManager } from "@/services/dashboards/DashboardManager";
import { editorHistory } from "@/services/dashboards/editor/HistoryStack";
import { editorClipboard } from "@/services/dashboards/editor/Clipboard";
import { registerPlaceholderWidgets } from "@/services/dashboards/editor/PlaceholderWidgets";
import { startAutoSave } from "@/services/dashboards/editor/AutoSave";
import type { DashboardId } from "@/models/dashboard";
import type { WidgetInstanceId } from "@/models/widgetInstance";

let bootstrapped = false;

export function useDashboardEditor(dashboardId: DashboardId | undefined) {
  const mode = useEditorStore((s) => s.mode);
  const bp = useEditorStore((s) => s.activeBreakpoint);
  const zoom = useEditorStore((s) => s.zoom);
  const selection = useEditorStore((s) => s.selection);
  const historyTick = useEditorStore((s) => s.historyTick);

  const dashboard = useDashboardsStore((s) => (dashboardId ? s.dashboards.get(dashboardId) : undefined));
  const widgets = useWidgetInstancesStore((s) =>
    dashboardId
      ? Array.from(s.instances.values()).filter((w) => w.dashboardId === dashboardId)
      : [],
  );
  const grid = useLayoutsStore((s) => (dashboardId ? s.layouts.get(dashboardId)?.[bp] : undefined));
  const registry = useWidgetRegistryStore((s) => s.byId);

  useEffect(() => {
    if (bootstrapped) return;
    bootstrapped = true;
    registerPlaceholderWidgets();
    startAutoSave();
  }, []);

  useEffect(() => {
    if (dashboardId) useLayoutsStore.getState().ensure(dashboardId);
  }, [dashboardId]);

  useEffect(() => {
    const unsub = editorHistory.subscribe(() => useEditorStore.getState().bumpHistory());
    return unsub;
  }, []);

  return {
    mode,
    breakpoint: bp,
    zoom,
    selection,
    historyTick,
    dashboard,
    widgets,
    grid,
    registry,
    canUndo: editorHistory.canUndo(),
    canRedo: editorHistory.canRedo(),

    // Actions
    enterEdit: () => useEditorStore.getState().enterEdit(),
    exitEdit: () => useEditorStore.getState().exitEdit(),
    select: (id: WidgetInstanceId | null) => useEditorStore.getState().select(id),
    clearSelection: () => useEditorStore.getState().clearSelection(),
    undo: () => editorHistory.undo(),
    redo: () => editorHistory.redo(),
    copy: () => editorClipboard.copy(Array.from(useEditorStore.getState().selection)),
    cut: () => editorClipboard.cut(Array.from(useEditorStore.getState().selection)),
    paste: () => {
      if (!dashboardId) return;
      const created = editorClipboard.paste(dashboardId);
      if (created.length > 0) useEditorStore.getState().select(created[0].id);
    },
    duplicate: () => {
      const created = editorClipboard.duplicate(Array.from(useEditorStore.getState().selection));
      if (created.length > 0) useEditorStore.getState().select(created[0].id);
    },
    deleteSelected: () => {
      for (const id of useEditorStore.getState().selection) widgetManager.remove(id);
      useEditorStore.getState().clearSelection();
    },
    exportDashboard: () => (dashboardId ? dashboardManager.export(dashboardId) : null),
  };
}
