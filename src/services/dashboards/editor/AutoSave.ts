import { dashboardManager } from "@/services/dashboards/DashboardManager";
import { dashboardEvents } from "@/services/dashboards/DashboardEvents";

let timer: ReturnType<typeof setTimeout> | null = null;
let started = false;
let unsub: (() => void)[] = [];

const DELAY_MS = 400;

function schedule() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    dashboardManager.persist();
  }, DELAY_MS);
}

export function startAutoSave(): void {
  if (started) return;
  started = true;
  const events: Array<keyof import("@/models/dashboardEvents").DashboardEventMap> = [
    "dashboardCreated",
    "dashboardDeleted",
    "dashboardUpdated",
    "dashboardReordered",
    "widgetCreated",
    "widgetDeleted",
    "widgetMoved",
    "widgetResized",
    "widgetUpdated",
    "layoutChanged",
  ];
  for (const ev of events) {
    unsub.push(dashboardEvents.on(ev, schedule));
  }
}

export function stopAutoSave(): void {
  for (const u of unsub) u();
  unsub = [];
  if (timer) clearTimeout(timer);
  timer = null;
  started = false;
}
