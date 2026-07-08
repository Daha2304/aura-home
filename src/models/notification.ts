import type { ID, Timestamp } from "./common";

export type NotificationSeverity = "info" | "success" | "warning" | "error";

export interface AppNotification {
  id: ID;
  severity: NotificationSeverity;
  title: string;
  message?: string;
  createdAt: Timestamp;
  read?: boolean;
  source?: string;
  meta?: Record<string, unknown>;
}
