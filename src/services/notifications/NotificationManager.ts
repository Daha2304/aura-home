import type {
  AppNotification,
  NotificationAction,
  NotificationInput,
} from "@/models/notification";
import { useNotificationsStore } from "@/store/slices/notificationsStore";
import { useNotificationPreferencesStore } from "@/store/slices/notificationPreferencesStore";
import { notificationRuleEngine } from "./NotificationRuleEngine";
import { notificationRegistry } from "./NotificationRegistry";
import { TypedEmitter } from "@/services/events/EventEmitter";
import { createId } from "@/utils/ids";

interface ManagerEvents {
  pushed: { notification: AppNotification; muted: boolean };
  updated: { id: string };
  removed: { id: string };
  toast: { notification: AppNotification };
}

class NotificationManagerImpl {
  readonly events = new TypedEmitter<ManagerEvents>();

  push(input: NotificationInput | AppNotification): AppNotification {
    const now = Date.now();
    const asExisting = (input as AppNotification).id !== undefined;
    const base: AppNotification = asExisting
      ? (input as AppNotification)
      : {
          id: createId("n"),
          uuid:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : createId("uuid"),
          severity: (input as NotificationInput).severity ?? "info",
          title: (input as NotificationInput).title,
          message: (input as NotificationInput).message,
          createdAt: now,
          category: (input as NotificationInput).category,
          priority: (input as NotificationInput).priority ?? "normal",
          icon: (input as NotificationInput).icon,
          color: (input as NotificationInput).color,
          refType: (input as NotificationInput).refType,
          refId: (input as NotificationInput).refId,
          source: (input as NotificationInput).source,
          templateId: (input as NotificationInput).templateId,
          userId: (input as NotificationInput).userId,
          tags: (input as NotificationInput).tags,
          actions: (input as NotificationInput).actions,
          custom: (input as NotificationInput).custom,
          status: "active",
        };

    const decision = notificationRuleEngine.evaluate(base);
    const prefs = useNotificationPreferencesStore.getState().preferences;

    // Store immer: muted-Einträge bleiben in der Inbox (nur nicht als Toast).
    // Kategorie-Mute laut Prefs führt zum Verwerfen des Store-Eintrags —
    // die Timeline behält den Eintrag optional via archiveMutedInTimeline.
    const dropFromStore =
      base.category && prefs.mutedCategories.includes(base.category);

    if (!dropFromStore) {
      useNotificationsStore.getState().push(base);
    }

    this.events.emit("pushed", { notification: base, muted: decision.muted });

    if (!decision.muted && !dropFromStore && prefs.toastsEnabled) {
      this.events.emit("toast", { notification: base });
    }

    return base;
  }

  markRead(id: string): void {
    useNotificationsStore.getState().markRead(id);
    this.events.emit("updated", { id });
  }

  markAllRead(): void {
    useNotificationsStore.getState().markAllRead();
    this.events.emit("updated", { id: "*" });
  }

  pin(id: string, pinned = true): void {
    useNotificationsStore.getState().update(id, { pinned });
    this.events.emit("updated", { id });
  }

  favorite(id: string, favorite = true): void {
    useNotificationsStore.getState().update(id, { favorite });
    this.events.emit("updated", { id });
  }

  archive(id: string, archived = true): void {
    useNotificationsStore.getState().update(id, { archived, status: archived ? "dismissed" : "active" });
    this.events.emit("updated", { id });
  }

  acknowledge(id: string, acknowledged = true): void {
    useNotificationsStore.getState().update(id, { acknowledged, read: true });
    this.events.emit("updated", { id });
  }

  remove(id: string): void {
    useNotificationsStore.getState().remove(id);
    this.events.emit("removed", { id });
  }

  async runAction(
    notificationId: string,
    action: NotificationAction,
    navigate?: (to: string) => void,
  ): Promise<void> {
    const handler = notificationRegistry.getActionHandler(action.kind);
    if (handler) {
      await handler(action, { notificationId, navigate });
    }
    this.markRead(notificationId);
  }
}

export const notificationManager = new NotificationManagerImpl();
