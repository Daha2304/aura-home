export type HapticPattern = "light" | "medium" | "heavy" | "success" | "warning";

const patterns: Record<HapticPattern, number | number[]> = {
  light: 8,
  medium: 14,
  heavy: 24,
  success: [10, 40, 12],
  warning: [16, 30, 16, 30, 16],
};

export function useHapticFeedback() {
  return (pattern: HapticPattern = "light") => {
    if (typeof window === "undefined") return;
    if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
    try {
      navigator.vibrate(patterns[pattern]);
    } catch {
      /* ignore */
    }
  };
}
