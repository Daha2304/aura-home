/**
 * Built-in Widget Descriptors.
 * Registriert System-, Raum-, Device-, Szenen-, Gruppen-, Automation-,
 * Analytics-, Notification-, User-, Search- und PWA-Widgets.
 */
import { registerSystemWidgets } from "./system";
import { registerRoomWidgets } from "./rooms";
import { registerDeviceWidgets } from "./devices";
import { registerSceneWidgets } from "./scenes";
import { registerGroupWidgets } from "./groups";
import { registerAutomationWidgets } from "./automations";
import { registerAnalyticsWidgets } from "./analytics";
import { registerNotificationWidgets } from "./notifications";
import { registerUserWidgets } from "./users";
import { registerSearchWidgets } from "./search";
import { registerPwaWidgets } from "./pwa";
import { registerDiagnosticsWidgets } from "./diagnostics";

export { registerSystemWidgets, SYSTEM_WIDGET_IDS } from "./system";
export { registerRoomWidgets, ROOM_WIDGET_IDS } from "./rooms";
export { registerDeviceWidgets, DEVICE_WIDGET_IDS } from "./devices";
export { registerSceneWidgets, SCENE_WIDGET_IDS } from "./scenes";
export { registerGroupWidgets, GROUP_WIDGET_IDS } from "./groups";
export { registerAutomationWidgets, AUTOMATION_WIDGET_IDS } from "./automations";
export { registerAnalyticsWidgets, ANALYTICS_WIDGET_IDS } from "./analytics";
export { registerNotificationWidgets, NOTIFICATION_WIDGET_IDS } from "./notifications";
export { registerUserWidgets, USER_WIDGET_IDS } from "./users";
export { registerSearchWidgets, SEARCH_WIDGET_IDS } from "./search";
export { registerPwaWidgets, PWA_WIDGET_IDS } from "./pwa";
export { registerDiagnosticsWidgets, DIAGNOSTICS_WIDGET_IDS } from "./diagnostics";

registerSystemWidgets();
registerRoomWidgets();
registerDeviceWidgets();
registerSceneWidgets();
registerGroupWidgets();
registerAutomationWidgets();
registerAnalyticsWidgets();
registerNotificationWidgets();
registerUserWidgets();
registerSearchWidgets();
registerPwaWidgets();
registerDiagnosticsWidgets();
