/**
 * Semantic accent tokens for room/device categories.
 * Values are CSS color strings applied via inline style to set --accent
 * on a scoped surface (e.g. RoomCard, DeviceCard).
 */

export const accentPalette = {
  blue: "oklch(0.68 0.16 250)",
  teal: "oklch(0.72 0.14 195)",
  mint: "oklch(0.78 0.14 165)",
  green: "oklch(0.72 0.16 150)",
  yellow: "oklch(0.85 0.16 90)",
  orange: "oklch(0.75 0.17 55)",
  red: "oklch(0.68 0.2 25)",
  pink: "oklch(0.75 0.17 355)",
  purple: "oklch(0.68 0.18 300)",
  indigo: "oklch(0.62 0.19 275)",
  gray: "oklch(0.68 0.02 260)",
} as const;

export type AccentName = keyof typeof accentPalette;
