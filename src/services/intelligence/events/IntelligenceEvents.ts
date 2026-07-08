import { TypedEmitter } from "@/services/events/EventEmitter";
import type { IntelligenceEventMap } from "@/models/intelligenceEvents";

/** Zentraler, typisierter Emitter für den Intelligence Layer. */
export const intelligenceEvents = new TypedEmitter<IntelligenceEventMap>();
