/**
 * Built-in Widget Descriptors.
 * Registriert System-, Raum-, Device-, Szenen- und Gruppen-Widgets.
 */
import { registerSystemWidgets } from "./system";
import { registerRoomWidgets } from "./rooms";
import { registerDeviceWidgets } from "./devices";
import { registerSceneWidgets } from "./scenes";
import { registerGroupWidgets } from "./groups";

export { registerSystemWidgets, SYSTEM_WIDGET_IDS } from "./system";
export { registerRoomWidgets, ROOM_WIDGET_IDS } from "./rooms";
export { registerDeviceWidgets, DEVICE_WIDGET_IDS } from "./devices";
export { registerSceneWidgets, SCENE_WIDGET_IDS } from "./scenes";
export { registerGroupWidgets, GROUP_WIDGET_IDS } from "./groups";

registerSystemWidgets();
registerRoomWidgets();
registerDeviceWidgets();
registerSceneWidgets();
registerGroupWidgets();

