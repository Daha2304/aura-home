import { TypedEmitter } from "@/services/events/EventEmitter";
import type { DashboardEventMap } from "@/models/dashboardEvents";

/**
 * Öffentlicher Dashboard-Event-Bus. Entkoppelt Manager von UI/Hooks.
 */
export const dashboardEvents = new TypedEmitter<DashboardEventMap>();
