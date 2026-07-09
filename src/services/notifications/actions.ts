import {
  notificationRegistry,
  type NotificationActionHandler,
} from "./NotificationRegistry";
import type { NotificationAction } from "@/models/notification";

/**
 * Generische Aktions-Handler. Delegieren an vorhandene Manager / Router,
 * ohne parallele Sonderpfade zu schaffen. `run-scene` / `run-automation`
 * werden erst zur Laufzeit importiert, damit hier keine harte Kopplung
 * an die Manager-Module entsteht.
 */

function pathFor(action: NotificationAction, prefix: string): string | null {
  const t = action.target ?? action.payload?.id;
  return t ? `${prefix}/${t}` : null;
}

const navigateHandler: NotificationActionHandler = (a, ctx) => {
  if (a.target && ctx.navigate) ctx.navigate(a.target);
};

function makeRouteHandler(prefix: string): NotificationActionHandler {
  return (a, ctx) => {
    const to = pathFor(a, prefix);
    if (to && ctx.navigate) ctx.navigate(to);
  };
}

const openLog: NotificationActionHandler = (a, ctx) => {
  const ref = a.payload?.refId ?? a.target;
  const to = ref ? `/timeline?refId=${encodeURIComponent(String(ref))}` : "/timeline";
  ctx.navigate?.(to);
};

const runScene: NotificationActionHandler = async (a) => {
  const id = String(a.target ?? a.payload?.id ?? "");
  if (!id) return;
  try {
    const mod = await import("@/services/scenes/SceneManager");
    // Best-effort — konkrete API bleibt bei SceneManager
    // (Signaturen unverändert; hier nur generischer Aufruf).
    const mgr: any = (mod as any).sceneManager ?? (mod as any).default;
    await mgr?.run?.(id);
  } catch {
    /* noop */
  }
};

const runAutomation: NotificationActionHandler = async (a) => {
  const id = String(a.target ?? a.payload?.id ?? "");
  if (!id) return;
  try {
    const mod = await import("@/services/automations/AutomationManager");
    const mgr: any = (mod as any).automationManager ?? (mod as any).default;
    await (mgr?.trigger?.(id) ?? mgr?.run?.(id));
  } catch {
    /* noop */
  }
};

export function registerBuiltinNotificationActions(): void {
  notificationRegistry.registerActionHandler("navigate", navigateHandler);
  notificationRegistry.registerActionHandler(
    "open-device",
    makeRouteHandler("/devices"),
  );
  notificationRegistry.registerActionHandler(
    "open-room",
    makeRouteHandler("/rooms"),
  );
  notificationRegistry.registerActionHandler(
    "open-group",
    makeRouteHandler("/groups"),
  );
  notificationRegistry.registerActionHandler(
    "open-scene",
    makeRouteHandler("/scenes"),
  );
  notificationRegistry.registerActionHandler(
    "open-automation",
    makeRouteHandler("/automations"),
  );
  notificationRegistry.registerActionHandler("open-log", openLog);
  notificationRegistry.registerActionHandler("run-scene", runScene);
  notificationRegistry.registerActionHandler("run-automation", runAutomation);
}
