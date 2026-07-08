import { TypedEmitter } from "@/services/events/EventEmitter";
import type { SceneEvents } from "@/models/sceneEvents";
import type { GroupEvents } from "@/models/groupEvents";

export const sceneEvents = new TypedEmitter<SceneEvents>();
export const groupEvents = new TypedEmitter<GroupEvents>();
