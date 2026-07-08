/**
 * Lebenszyklus eines Geräts. Der Übergang ist deterministisch —
 * siehe {@link services/discovery/LifecycleMachine}.
 */
export type LifecycleState =
  | "new"
  | "initializing"
  | "discovering"
  | "ready"
  | "updating"
  | "offline"
  | "error"
  | "removing"
  | "removed";

export const LIFECYCLE_TRANSITIONS: Readonly<Record<LifecycleState, readonly LifecycleState[]>> = {
  new: ["initializing", "discovering", "removed", "error"],
  initializing: ["discovering", "ready", "error", "offline", "removed"],
  discovering: ["ready", "error", "offline", "removed"],
  ready: ["updating", "offline", "error", "removing"],
  updating: ["ready", "error", "offline"],
  offline: ["ready", "error", "removing"],
  error: ["initializing", "ready", "offline", "removing"],
  removing: ["removed", "error"],
  removed: [],
};

export function canTransition(from: LifecycleState, to: LifecycleState): boolean {
  if (from === to) return true;
  return LIFECYCLE_TRANSITIONS[from].includes(to);
}
