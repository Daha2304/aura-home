import {
  renderTemplate,
  type NotificationTemplate,
} from "@/models/notificationTemplate";
import type { NotificationInput } from "@/models/notification";
import { useNotificationTemplatesStore } from "@/store/slices/notificationTemplatesStore";

class NotificationTemplateRegistryImpl {
  private readonly builtin = new Map<string, NotificationTemplate>();

  register(tpl: NotificationTemplate): void {
    this.builtin.set(tpl.id, tpl);
  }

  get(id: string): NotificationTemplate | undefined {
    return (
      useNotificationTemplatesStore.getState().templates.find((t) => t.id === id) ??
      this.builtin.get(id)
    );
  }

  list(): NotificationTemplate[] {
    const user = useNotificationTemplatesStore.getState().templates;
    const map = new Map<string, NotificationTemplate>();
    for (const t of this.builtin.values()) map.set(t.id, t);
    for (const t of user) map.set(t.id, t);
    return Array.from(map.values());
  }

  render(id: string, data?: Record<string, unknown>): NotificationInput | undefined {
    const tpl = this.get(id);
    return tpl ? renderTemplate(tpl, data) : undefined;
  }
}

export const notificationTemplateRegistry = new NotificationTemplateRegistryImpl();
