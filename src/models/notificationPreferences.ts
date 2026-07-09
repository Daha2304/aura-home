import type { Severity } from "./severity";
import type { EventCategory } from "./eventCategory";

export interface NotificationPreferences {
  /** Global Toasts aktiv? */
  toastsEnabled: boolean;
  /** Toast nur ab dieser Severity anzeigen. */
  toastMinSeverity: Severity;
  /** Max. gleichzeitig sichtbare Toasts. */
  toastMaxVisible: number;
  /** Auto-Dismiss Basis-Dauer (ms). */
  toastDefaultDurationMs: number;
  /** Notifications dieser Kategorien werden verworfen. */
  mutedCategories: EventCategory[];
  /** Ringpuffer-Größe des Notification Store. */
  maxStoreSize: number;
  /** Auch stumme Notifications in Timeline archivieren. */
  archiveMutedInTimeline: boolean;
  /** Badge auf Bottom-Nav anzeigen. */
  showBadges: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  toastsEnabled: true,
  toastMinSeverity: "info",
  toastMaxVisible: 4,
  toastDefaultDurationMs: 5000,
  mutedCategories: [],
  maxStoreSize: 500,
  archiveMutedInTimeline: true,
  showBadges: true,
};
