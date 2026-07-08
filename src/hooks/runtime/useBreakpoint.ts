import { useSyncExternalStore } from "react";
import { breakpointDetector } from "@/services/runtime/BreakpointDetector";
import type { LayoutBreakpoint } from "@/models/layout";

const subscribe = (l: () => void) => breakpointDetector.subscribe(l);
const getSnapshot = (): LayoutBreakpoint => breakpointDetector.get();

export function useBreakpoint(): LayoutBreakpoint {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
