/**
 * Design Tokens — zentrale Werte für das gesamte UI Design System.
 * Diese Werte spiegeln die CSS-Custom-Properties aus src/styles.css.
 * Komponenten nutzen ausschließlich diese Tokens (nie Hex-Codes inline).
 */

export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.5rem",
  "2xl": "2rem",
  "3xl": "3rem",
} as const;

export const radius = {
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
  "2xl": "var(--radius-2xl)",
  "3xl": "var(--radius-3xl)",
  full: "9999px",
} as const;

export const iconSize = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
  "2xl": "h-10 w-10",
} as const;

export const glassIntensity = {
  light: "backdrop-blur-md saturate-150",
  medium: "backdrop-blur-xl saturate-[1.7]",
  heavy: "backdrop-blur-2xl saturate-[2]",
} as const;

export const shadowToken = {
  none: "shadow-none",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
  "2xl": "shadow-2xl",
} as const;

export const animationSpeed = {
  instant: 0.1,
  fast: 0.18,
  base: 0.25,
  slow: 0.4,
  slower: 0.6,
} as const;

export const typography = {
  hero: "text-[34px] leading-[1.05] font-bold tracking-tight",
  title: "text-2xl font-semibold tracking-tight",
  headline: "text-lg font-semibold",
  body: "text-[15px]",
  bodySm: "text-sm",
  caption: "text-xs text-muted-foreground",
  label: "text-[13px] font-medium",
} as const;

export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
export type IconSize = keyof typeof iconSize;
