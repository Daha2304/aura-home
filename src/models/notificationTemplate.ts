import type { Severity } from "./severity";
import type { EventCategory } from "./eventCategory";
import type {
  NotificationAction,
  NotificationInput,
  NotificationPriority,
  NotificationRefType,
} from "./notification";

export interface NotificationTemplate {
  id: string;
  label: string;
  titleTemplate: string;
  messageTemplate?: string;
  defaultSeverity: Severity;
  defaultCategory?: EventCategory;
  defaultPriority?: NotificationPriority;
  defaultIcon?: string;
  defaultColor?: string;
  refType?: NotificationRefType;
  defaultActions?: NotificationAction[];
  /** Vorbereitung Teil 12. */
  userScope?: "any" | "user";
}

/** Ersetzt `{{key}}` durch `data[key]`. Unbekannte Schlüssel werden leer. */
export function renderTemplateString(
  tpl: string,
  data: Record<string, unknown> | undefined,
): string {
  if (!data) return tpl.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, "");
  return tpl.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, k) => {
    const v = data[k];
    return v === undefined || v === null ? "" : String(v);
  });
}

export function renderTemplate(
  tpl: NotificationTemplate,
  data?: Record<string, unknown>,
): NotificationInput {
  return {
    title: renderTemplateString(tpl.titleTemplate, data),
    message: tpl.messageTemplate
      ? renderTemplateString(tpl.messageTemplate, data)
      : undefined,
    severity: tpl.defaultSeverity,
    category: tpl.defaultCategory,
    priority: tpl.defaultPriority,
    icon: tpl.defaultIcon,
    color: tpl.defaultColor,
    refType: tpl.refType,
    actions: tpl.defaultActions,
    templateId: tpl.id,
  };
}
