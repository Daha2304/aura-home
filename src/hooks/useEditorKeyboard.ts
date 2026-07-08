import { useEffect } from "react";
import { useEditorStore } from "@/store/slices/editorStore";
import { editorHistory } from "@/services/dashboards/editor/HistoryStack";
import { editorClipboard } from "@/services/dashboards/editor/Clipboard";
import { widgetManager } from "@/services/widgets/WidgetManager";
import { useLayoutsStore } from "@/store/slices/layoutsStore";
import { useWidgetInstancesStore } from "@/store/slices/widgetInstancesStore";

/**
 * Keyboard-Shortcuts: Undo/Redo, Copy/Cut/Paste/Duplicate, Delete, Esc,
 * Pfeiltasten (1 Grid-Zelle).
 */
export function useEditorKeyboard(dashboardId: string | undefined) {
  useEffect(() => {
    if (!dashboardId) return;
    const onKey = (e: KeyboardEvent) => {
      const s = useEditorStore.getState();
      if (s.mode !== "edit") return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;

      const mod = e.metaKey || e.ctrlKey;
      const ids = Array.from(s.selection);

      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) editorHistory.redo();
        else editorHistory.undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        editorHistory.redo();
        return;
      }
      if (mod && e.key.toLowerCase() === "c") { e.preventDefault(); editorClipboard.copy(ids); return; }
      if (mod && e.key.toLowerCase() === "x") { e.preventDefault(); editorClipboard.cut(ids); return; }
      if (mod && e.key.toLowerCase() === "v") { e.preventDefault(); editorClipboard.paste(dashboardId); return; }
      if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        editorClipboard.duplicate(ids);
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        for (const id of ids) widgetManager.remove(id);
        s.clearSelection();
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        s.clearSelection();
        return;
      }
      if (e.key.startsWith("Arrow") && ids.length > 0) {
        e.preventDefault();
        const bp = s.activeBreakpoint;
        const grid = useLayoutsStore.getState().getGrid(dashboardId, bp);
        if (!grid) return;
        for (const id of ids) {
          const inst = useWidgetInstancesStore.getState().getById(id);
          const p = grid.placements[id];
          if (!inst || !p) continue;
          const step = e.shiftKey ? 5 : 1;
          const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
          const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
          widgetManager.move(id, bp, {
            ...p,
            gridX: Math.max(0, Math.min(grid.columns - p.w, p.gridX + dx)),
            gridY: Math.max(0, p.gridY + dy),
          });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dashboardId]);
}
