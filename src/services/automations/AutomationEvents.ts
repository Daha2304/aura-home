import { TypedEmitter } from "@/services/events/EventEmitter";
import type { AutomationEvents } from "@/models/automationEvents";

export const automationEvents = new TypedEmitter<AutomationEvents>();
