export type WidgetAnimation =
  | "none"
  | "fade"
  | "scale"
  | "slide"
  | "blur"
  | "glass"
  | "spring";

export interface WidgetAnimationConfig {
  kind: WidgetAnimation;
  duration?: number; // ms
  delay?: number; // ms
  stiffness?: number; // spring
  damping?: number; // spring
}

export const DEFAULT_ANIMATION: WidgetAnimationConfig = { kind: "fade", duration: 240 };
