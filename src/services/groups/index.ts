export { groupManager } from "./GroupManager";
export { groupRegistry } from "./GroupRegistry";
export { groupResolver } from "./GroupResolver";
export { groupExecutor } from "./GroupExecutor";
export { exportGroups, importGroups } from "./groupSerialization";

import { groupManager } from "./GroupManager";
import { groupExecutor } from "./GroupExecutor";

let detach: (() => void) | null = null;

export function bootstrapGroups(): void {
  groupManager.hydrate();
  detach?.();
  detach = groupExecutor.attachToCommandQueue();
}

export function stopGroups(): void {
  detach?.();
  detach = null;
}
