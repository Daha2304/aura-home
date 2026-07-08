import { useSyncExternalStore } from "react";
import { breakpointDetector } from "@/services/runtime/BreakpointDetector";

export function useBreakpoint() {
  return useSyncExternalStore(
    (l) => breakpointDetector.subscribe(l),
    () => breakpointDetector.get(),
    () => breakpointDetector.get(),
  );
}
