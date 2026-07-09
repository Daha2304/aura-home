import { z } from "zod";
import type { Automation } from "@/models/automation";
import type { AutomationTemplate } from "@/models/automationTemplate";
import type { AutomationVersion } from "@/models/automationVersion";
import type { AutomationVariable } from "@/models/automationVariable";
import { useAutomationsStore } from "@/store/slices/automationsStore";
import { useAutomationVersionsStore } from "@/store/slices/automationVersionsStore";
import { useAutomationTemplatesStore } from "@/store/slices/automationTemplatesStore";
import { useAutomationVariablesStore } from "@/store/slices/automationVariablesStore";
import { automationEvents } from "./AutomationEvents";

const SCHEMA_VERSION = 1;

const AutomationSchema = z
  .object({
    id: z.string(),
    uuid: z.string(),
    name: z.string(),
    version: z.number(),
    triggers: z.array(z.any()),
    actions: z.array(z.any()),
    conditions: z.any().optional(),
    enabled: z.boolean(),
    tags: z.array(z.string()),
    favorite: z.boolean(),
    priority: z.number(),
    createdAt: z.number(),
    updatedAt: z.number(),
    errorStrategy: z.enum(["abort", "continue", "retry"]),
    archived: z.boolean(),
    order: z.number(),
  })
  .passthrough();

const BundleSchema = z.object({
  schemaVersion: z.number(),
  exportedAt: z.number(),
  automations: z.array(AutomationSchema),
  templates: z.array(z.any()).optional(),
  versions: z.record(z.string(), z.array(z.any())).optional(),
  variables: z.array(z.any()).optional(),
});

export interface AutomationBundle {
  schemaVersion: number;
  exportedAt: number;
  automations: Automation[];
  templates?: AutomationTemplate[];
  versions?: Record<string, AutomationVersion[]>;
  variables?: AutomationVariable[];
}

export function exportAutomations(): AutomationBundle {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: Date.now(),
    automations: useAutomationsStore.getState().automations,
    templates: useAutomationTemplatesStore.getState().templates,
    versions: useAutomationVersionsStore.getState().byAutomation,
    variables: useAutomationVariablesStore.getState().variables,
  };
}

export type ImportStrategy = "merge" | "replace";

export interface ImportResult {
  ok: boolean;
  imported: number;
  errors: string[];
}

export function importAutomations(raw: unknown, strategy: ImportStrategy = "merge"): ImportResult {
  const errors: string[] = [];
  const parsed = BundleSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, imported: 0, errors: parsed.error.errors.map((e) => e.message) };
  }
  const bundle = parsed.data as unknown as AutomationBundle;
  const store = useAutomationsStore.getState();
  const current = store.automations;
  const incoming = bundle.automations as Automation[];

  let next: Automation[];
  if (strategy === "replace") {
    next = incoming;
  } else {
    const byId = new Map<string, Automation>();
    for (const a of current) byId.set(a.id, a);
    for (const a of incoming) byId.set(a.id, a);
    next = Array.from(byId.values());
  }
  store.setAutomations(next);

  if (bundle.templates) {
    useAutomationTemplatesStore.getState().setAll(bundle.templates);
  }
  if (bundle.versions) {
    useAutomationVersionsStore.getState().setAll(bundle.versions);
  }
  if (bundle.variables) {
    useAutomationVariablesStore.getState().setAll(bundle.variables);
  }

  automationEvents.emit("automationsImported", { count: incoming.length });
  automationEvents.emit("changed", undefined);
  return { ok: true, imported: incoming.length, errors };
}
