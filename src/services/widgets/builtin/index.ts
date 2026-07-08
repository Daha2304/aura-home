/**
 * Built-in Widget Descriptors.
 * Registriert System-, Raum- und Device-Widgets. Weitere Smart-Home-Widgets
 * folgen in späteren Teilen.
 */
import { registerSystemWidgets } from "./system";
import { registerRoomWidgets } from "./rooms";
import { registerDeviceWidgets } from "./devices";

export { registerSystemWidgets, SYSTEM_WIDGET_IDS } from "./system";
export { registerRoomWidgets, ROOM_WIDGET_IDS } from "./rooms";
export { registerDeviceWidgets, DEVICE_WIDGET_IDS } from "./devices";

registerSystemWidgets();
registerRoomWidgets();
registerDeviceWidgets();
