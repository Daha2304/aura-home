export type WidgetLifecycle =
  | "new"
  | "loading"
  | "ready"
  | "updating"
  | "error"
  | "hidden"
  | "disabled"
  | "deleted";

const TRANSITIONS: Record<WidgetLifecycle, WidgetLifecycle[]> = {
  new: ["loading", "ready", "disabled", "deleted"],
  loading: ["ready", "error", "hidden", "deleted"],
  ready: ["updating", "error", "hidden", "disabled", "deleted"],
  updating: ["ready", "error", "hidden", "deleted"],
  error: ["loading", "ready", "hidden", "disabled", "deleted"],
  hidden: ["ready", "disabled", "deleted"],
  disabled: ["ready", "hidden", "deleted"],
  deleted: [],
};

export function canTransitionWidget(from: WidgetLifecycle, to: WidgetLifecycle): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}
