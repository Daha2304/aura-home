import type { DiscoveryEventMap } from "@/models/discoveryEvents";
import { TypedEmitter } from "@/services/events/EventEmitter";

/**
 * Öffentlicher Kanal für Discovery-Events. Wird vom DiscoveryEngine
 * gespeist. UI-Hooks können darauf hören, ohne den Store zu pollen.
 */
export const discoveryEvents = new TypedEmitter<DiscoveryEventMap>();
