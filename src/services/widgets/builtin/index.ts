/**
 * Built-in Widget Descriptors.
 * Registriert System-Widgets und Raum-Widgets. Weitere Smart-Home-Widgets
 * folgen in späteren Teilen.
 */
import { registerSystemWidgets } from "./system";
import { registerRoomWidgets } from "./rooms";

export { registerSystemWidgets, SYSTEM_WIDGET_IDS } from "./system";
export { registerRoomWidgets, ROOM_WIDGET_IDS } from "./rooms";

registerSystemWidgets();
registerRoomWidgets();
