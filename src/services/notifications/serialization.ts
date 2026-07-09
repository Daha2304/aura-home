import { useNotificationRulesStore } from "@/store/slices/notificationRulesStore";
import { useNotificationTemplatesStore } from "@/store/slices/notificationTemplatesStore";
import { useNotificationPreferencesStore } from "@/store/slices/notificationPreferencesStore";

export interface NotificationExport {
  version: 1;
  preferences: ReturnType<typeof useNotificationPreferencesStore.getState>["preferences"];
  rules: ReturnType<typeof useNotificationRulesStore.getState>["rules"];
  templates: ReturnType<typeof useNotificationTemplatesStore.getState>["templates"];
}

export function exportNotificationConfig(): NotificationExport {
  return {
    version: 1,
    preferences: useNotificationPreferencesStore.getState().preferences,
    rules: useNotificationRulesStore.getState().rules,
    templates: useNotificationTemplatesStore.getState().templates,
  };
}

export function importNotificationConfig(data: NotificationExport): void {
  if (data.version !== 1) throw new Error("Unsupported notification export version");
  useNotificationPreferencesStore.getState().set(data.preferences);
  useNotificationRulesStore.getState().replaceAll(data.rules);
  useNotificationTemplatesStore.getState().replaceAll(data.templates);
}
