import { LayoutGroup } from "framer-motion";
import type { ReactNode } from "react";

/**
 * SharedLayout — Wrapper um framer-motion `LayoutGroup`.
 * Konvention für stabile layoutIds:
 *   room-card-<roomId>
 *   room-hero-<roomId>
 *   device-card-<deviceId>
 */
export function SharedLayout({
  id,
  children,
}: {
  id?: string;
  children: ReactNode;
}) {
  return <LayoutGroup id={id}>{children}</LayoutGroup>;
}

export const layoutIds = {
  roomCard: (id: string) => `room-card-${id}`,
  roomHero: (id: string) => `room-hero-${id}`,
  deviceCard: (id: string) => `device-card-${id}`,
} as const;
