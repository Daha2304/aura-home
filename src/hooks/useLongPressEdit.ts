import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEditorStore } from "@/store/slices/editorStore";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

/**
 * Long-Press (500 ms) auf ein Widget → Edit-Mode + Selection.
 * Bewegung > 8 px bricht ab.
 */
export function useLongPressEdit(widgetId: string, delay = 500) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const haptic = useHapticFeedback();

  const clear = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    start.current = null;
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (useEditorStore.getState().mode === "edit") return; // schon aktiv
    start.current = { x: e.clientX, y: e.clientY };
    timer.current = setTimeout(() => {
      timer.current = null;
      useEditorStore.getState().enterEdit();
      useEditorStore.getState().select(widgetId);
      haptic("medium");
    }, delay);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (!start.current) return;
    const dx = Math.abs(e.clientX - start.current.x);
    const dy = Math.abs(e.clientY - start.current.y);
    if (dx > 8 || dy > 8) clear();
  };
  const onPointerUp = () => clear();
  const onPointerCancel = () => clear();

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
}
