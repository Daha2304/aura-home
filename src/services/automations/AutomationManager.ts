import type {
  Automation,
  AutomationAction,
  AutomationTrigger,
  AutomationCategory,
  ConditionNode,
  AutomationErrorStrategy,
} from "@/models/automation";
import { useAutomationsStore } from "@/store/slices/automationsStore";
import { readJson, writeJson } from "@/services/storage/localStorage";
import { createId } from "@/utils/ids";
import { createLogger } from "@/services/logger/Logger";
import { automationEvents } from "./AutomationEvents";
import { automationVersionStore } from "./AutomationVersionStore";
import { validateAutomation } from "./AutomationValidator";

const log = createLogger("automations");
const STORAGE_KEY = "automations.v2";
const LEGACY_KEY = "automations.v1";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as Crypto & { randomUUID: () => string }).randomUUID();
  }
  return createId("uuid");
}

/**
 * Migriere alte, flache Automationen (Teil <9) auf das neue Modell.
 * - `conditions: AutomationCondition[]` → impliziter `and`-Knoten.
 * - fehlende Felder werden mit sinnvollen Defaults gefüllt.
 */
function migrate(raw: unknown, order: number): Automation | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<Automation> & {
    conditions?: unknown;
    triggers?: Array<Partial<AutomationTrigger>>;
    actions?: Array<Partial<AutomationAction>>;
  };
  if (!r.id || !r.name) return null;
  const now = Date.now();

  const triggers: AutomationTrigger[] = (r.triggers ?? []).map((t) => ({
    id: t.id ?? createId("atr"),
    kind: t.kind ?? "custom",
    config: (t.config as Record<string, unknown>) ?? {},
  }));
  const actions: AutomationAction[] = (r.actions ?? []).map((a) => ({
    id: a.id ?? createId("aac"),
    kind: a.kind ?? "custom",
    config: (a.config as Record<string, unknown>) ?? {},
    delayMs: a.delayMs,
    parallel: a.parallel,
    optional: a.optional,
    errorStrategy: a.errorStrategy,
    retry: a.retry,
  }));

  // Bedingungen: alt = Array flach → and-Baum.
  let conditions: ConditionNode | undefined;
  if (Array.isArray(r.conditions)) {
    if (r.conditions.length > 0) {
      conditions = {
        id: createId("acn"),
        kind: "and",
        children: (r.conditions as Array<{
          id?: string;
          kind?: string;
          config?: Record<string, unknown>;
        }>).map((c) => ({
          id: c.id ?? createId("acn"),
          kind: c.kind ?? "custom",
          config: c.config ?? {},
        })),
      };
    }
  } else if (r.conditions && typeof r.conditions === "object") {
    conditions = r.conditions as ConditionNode;
  }

  return {
    id: r.id,
    uuid: r.uuid ?? uuid(),
    name: r.name,
    description: r.description,
    icon: r.icon ?? "workflow",
    color: r.color,
    category: (r.category as AutomationCategory | undefined) ?? "custom",
    tags: r.tags ?? [],
    favorite: r.favorite ?? false,
    enabled: r.enabled ?? true,
    priority: r.priority ?? 0,
    version: r.version ?? 1,
    createdAt: r.createdAt ?? now,
    updatedAt: r.updatedAt ?? now,
    createdBy: r.createdBy,
    updatedBy: r.updatedBy,
    custom: r.custom,
    triggers,
    conditions,
    actions,
    errorStrategy: (r.errorStrategy as AutomationErrorStrategy | undefined) ?? "continue",
    templateId: r.templateId,
    archived: r.archived ?? false,
    order: r.order ?? order,
  };
}

export interface CreateAutomationInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  category?: AutomationCategory;
  tags?: string[];
  favorite?: boolean;
  enabled?: boolean;
  priority?: number;
  triggers?: AutomationTrigger[];
  conditions?: ConditionNode;
  actions?: AutomationAction[];
  errorStrategy?: AutomationErrorStrategy;
  templateId?: string;
  createdBy?: string;
  custom?: Record<string, unknown>;
}

export class AutomationManager {
  private hydrated = false;
  private schedulerHook: ((a: Automation | null, previous: Automation | null) => void) | null = null;

  /** Wird vom Scheduler beim start() gesetzt. */
  setSchedulerHook(hook: typeof this.schedulerHook): void {
    this.schedulerHook = hook;
  }

  hydrate(): void {
    if (this.hydrated) return;
    this.hydrated = true;
    automationVersionStore.hydrate();

    let raw = readJson<unknown[]>(STORAGE_KEY);
    if (!raw) raw = readJson<unknown[]>(LEGACY_KEY);
    if (Array.isArray(raw)) {
      const list = raw.map((r, i) => migrate(r, i)).filter((a): a is Automation => !!a);
      useAutomationsStore.getState().setAutomations(list);
      log.info("hydrated", list.length, "automations");
    }
    useAutomationsStore.subscribe((s) => writeJson(STORAGE_KEY, s.automations));
  }

  list(): Automation[] {
    return useAutomationsStore.getState().automations;
  }

  get(id: string): Automation | undefined {
    return useAutomationsStore.getState().byId[id];
  }

  create(input: CreateAutomationInput): Automation {
    const now = Date.now();
    const order = useAutomationsStore.getState().automations.length;
    const a: Automation = {
      id: createId("auto"),
      uuid: uuid(),
      name: (input.name ?? "Neue Automation").trim() || "Neue Automation",
      description: input.description,
      icon: input.icon ?? "workflow",
      color: input.color,
      category: input.category ?? "custom",
      tags: input.tags ?? [],
      favorite: input.favorite ?? false,
      enabled: input.enabled ?? true,
      priority: input.priority ?? 0,
      version: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
      custom: input.custom,
      triggers: input.triggers ?? [],
      conditions: input.conditions,
      actions: input.actions ?? [],
      errorStrategy: input.errorStrategy ?? "continue",
      templateId: input.templateId,
      archived: false,
      order,
    };
    useAutomationsStore.getState().upsert(a);
    automationVersionStore.snapshot(a, input.createdBy);
    automationEvents.emit("automationCreated", { automation: a });
    automationEvents.emit("changed", undefined);
    this.schedulerHook?.(a, null);
    return a;
  }

  update(id: string, patch: Partial<Automation>, updatedBy?: string): Automation | undefined {
    const previous = this.get(id);
    if (!previous) return undefined;
    const next: Automation = {
      ...previous,
      ...patch,
      id: previous.id,
      uuid: previous.uuid,
      version: previous.version + 1,
      updatedAt: Date.now(),
      updatedBy: updatedBy ?? previous.updatedBy,
    };
    useAutomationsStore.getState().upsert(next);
    automationVersionStore.snapshot(next, updatedBy);
    automationEvents.emit("automationUpdated", { automation: next, previous });
    automationEvents.emit("changed", undefined);
    this.schedulerHook?.(next, previous);
    return next;
  }

  delete(id: string): boolean {
    const a = this.get(id);
    if (!a) return false;
    useAutomationsStore.getState().remove(id);
    automationVersionStore.clear(id);
    automationEvents.emit("automationDeleted", { id });
    automationEvents.emit("changed", undefined);
    this.schedulerHook?.(null, a);
    return true;
  }

  duplicate(id: string): Automation | undefined {
    const src = this.get(id);
    if (!src) return undefined;
    return this.create({
      name: `${src.name} (Kopie)`,
      description: src.description,
      icon: src.icon,
      color: src.color,
      category: src.category,
      tags: src.tags,
      favorite: false,
      enabled: false,
      priority: src.priority,
      triggers: src.triggers.map((t) => ({ ...t, id: createId("atr") })),
      conditions: src.conditions,
      actions: src.actions.map((a) => ({ ...a, id: createId("aac") })),
      errorStrategy: src.errorStrategy,
      templateId: src.templateId,
      custom: src.custom,
    });
  }

  toggleFavorite(id: string): void {
    const a = this.get(id);
    if (!a) return;
    this.update(id, { favorite: !a.favorite });
  }

  setEnabled(id: string, enabled: boolean): void {
    const a = this.get(id);
    if (!a || a.enabled === enabled) return;
    this.update(id, { enabled });
    if (enabled) automationEvents.emit("automationEnabled", { id });
    else automationEvents.emit("automationDisabled", { id });
  }

  archive(id: string, archived = true): void {
    this.update(id, { archived, enabled: archived ? false : this.get(id)?.enabled ?? true });
  }

  restoreVersion(id: string, versionNumber: number, updatedBy?: string): Automation | undefined {
    const versions = automationVersionStore.list(id);
    const v = versions.find((x) => x.versionNumber === versionNumber);
    if (!v) return undefined;
    return this.update(id, v.payload, updatedBy);
  }

  validate(id: string): ReturnType<typeof validateAutomation> | undefined {
    const a = this.get(id);
    if (!a) return undefined;
    return validateAutomation(a);
  }
}

export const automationManager = new AutomationManager();
