import { useRuntimeStore } from "@/store/slices/runtimeStore";

export function useRuntimeOverlays() {
  return useRuntimeStore((s) => s.overlays);
}
