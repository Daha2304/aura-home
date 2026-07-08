import type { ID, IconName, Timestamp } from "./common";

export type InsightScope = "room" | "house";
export type InsightSeverity = "info" | "success" | "warning" | "error";

export interface Insight {
  id: string;
  scope: InsightScope;
  roomId?: ID;
  kind: string;
  label: string;
  value?: string | number;
  icon?: IconName;
  severity?: InsightSeverity;
  createdAt: Timestamp;
  meta?: Record<string, unknown>;
}
