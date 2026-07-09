import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Plus, Trash2, Save } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { GlassButton } from "@/components/glass/GlassButton";
import { EmptyState } from "@/components/common/EmptyState";
import { useAutomationsStore } from "@/store/slices/automationsStore";
import {
  automationManager,
  triggerRegistry,
  conditionRegistry,
  actionRegistry,
  validateAutomation,
} from "@/services/automations";
import type {
  Automation,
  AutomationAction,
  AutomationTrigger,
  AutomationCategory,
  ConditionNode,
} from "@/models/automation";
import { createId } from "@/utils/ids";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/automations/$automationId/edit")({
  head: () => ({ meta: [{ title: "Automation bearbeiten" }] }),
  component: AutomationEditor,
});

type Step = "basics" | "triggers" | "conditions" | "actions" | "review";
const STEPS: Array<{ id: Step; label: string }> = [
  { id: "basics", label: "Basis" },
  { id: "triggers", label: "Auslöser" },
  { id: "conditions", label: "Bedingungen" },
  { id: "actions", label: "Aktionen" },
  { id: "review", label: "Prüfen" },
];

function AutomationEditor() {
  const { automationId } = Route.useParams();
  const navigate = useNavigate();
  const current = useAutomationsStore((s) => s.byId[automationId]);
  const [draft, setDraft] = useState<Automation | null>(current ?? null);
  const [step, setStep] = useState<Step>("basics");

  const validation = useMemo(() => (draft ? validateAutomation(draft) : null), [draft]);

  if (!draft) {
    return (
      <>
        <PageHeader title="Automation" />
        <EmptyState title="Nicht gefunden" description="Diese Automation existiert nicht mehr." />
      </>
    );
  }

  const patch = (p: Partial<Automation>) => setDraft({ ...draft, ...p });

  const save = () => {
    automationManager.update(draft.id, draft);
    navigate({ to: "/automations/$automationId", params: { automationId: draft.id } });
  };

  const idx = STEPS.findIndex((s) => s.id === step);
  const next = () => setStep(STEPS[Math.min(STEPS.length - 1, idx + 1)].id);
  const prev = () => setStep(STEPS[Math.max(0, idx - 1)].id);

  return (
    <>
      <PageHeader
        title={draft.name || "Neue Automation"}
        subtitle={`Schritt ${idx + 1}/${STEPS.length} – ${STEPS[idx].label}`}
        trailing={
          <GlassButton variant="ghost" size="sm" onClick={() => navigate({ to: "/automations" })}>
            <ChevronLeft className="h-4 w-4" />
          </GlassButton>
        }
      />

      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1" role="tablist">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={step === s.id}
            onClick={() => setStep(s.id)}
            className={cn(
              "inline-flex h-8 shrink-0 items-center rounded-full px-3 text-xs font-medium",
              step === s.id
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-background/40 text-muted-foreground",
            )}
          >
            {i + 1}. {s.label}
          </button>
        ))}
      </div>

      {step === "basics" && <BasicsStep draft={draft} patch={patch} />}
      {step === "triggers" && <TriggersStep draft={draft} patch={patch} />}
      {step === "conditions" && <ConditionsStep draft={draft} patch={patch} />}
      {step === "actions" && <ActionsStep draft={draft} patch={patch} />}
      {step === "review" && <ReviewStep draft={draft} validation={validation} />}

      <div className="mt-4 flex items-center gap-2">
        <GlassButton variant="ghost" onClick={prev} disabled={idx === 0}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Zurück
        </GlassButton>
        {idx < STEPS.length - 1 ? (
          <GlassButton variant="primary" onClick={next} className="ml-auto">
            Weiter <ChevronRight className="ml-1 h-4 w-4" />
          </GlassButton>
        ) : (
          <GlassButton variant="primary" onClick={save} className="ml-auto">
            <Save className="mr-1 h-4 w-4" /> Speichern
          </GlassButton>
        )}
      </div>
    </>
  );
}

// -------- Steps --------

const CATEGORIES: AutomationCategory[] = [
  "presence", "time", "climate", "light", "security", "media", "energy", "notification", "custom",
];

function BasicsStep({ draft, patch }: { draft: Automation; patch: (p: Partial<Automation>) => void }) {
  return (
    <GlassCard className="space-y-3">
      <Field label="Name">
        <input
          className="input-glass"
          value={draft.name}
          onChange={(e) => patch({ name: e.target.value })}
        />
      </Field>
      <Field label="Beschreibung">
        <textarea
          className="input-glass min-h-[64px]"
          value={draft.description ?? ""}
          onChange={(e) => patch({ description: e.target.value })}
        />
      </Field>
      <Field label="Kategorie">
        <select
          className="input-glass"
          value={draft.category ?? "custom"}
          onChange={(e) => patch({ category: e.target.value as AutomationCategory })}
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Priorität">
        <input
          className="input-glass"
          type="number"
          value={draft.priority}
          onChange={(e) => patch({ priority: parseInt(e.target.value, 10) || 0 })}
        />
      </Field>
      <Field label="Fehlerstrategie">
        <select
          className="input-glass"
          value={draft.errorStrategy}
          onChange={(e) => patch({ errorStrategy: e.target.value as Automation["errorStrategy"] })}
        >
          <option value="abort">abort</option>
          <option value="continue">continue</option>
          <option value="retry">retry</option>
        </select>
      </Field>
    </GlassCard>
  );
}

function TriggersStep({ draft, patch }: { draft: Automation; patch: (p: Partial<Automation>) => void }) {
  const options = triggerRegistry.all();
  const add = () => patch({ triggers: [...draft.triggers, { id: createId("atr"), kind: options[0]?.id ?? "custom", config: {} } as AutomationTrigger] });
  const upd = (i: number, t: AutomationTrigger) => patch({ triggers: draft.triggers.map((x, idx) => (idx === i ? t : x)) });
  const del = (i: number) => patch({ triggers: draft.triggers.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-2">
      {draft.triggers.map((t, i) => (
        <GlassPanel key={t.id} className="space-y-2 p-3">
          <div className="flex items-center gap-2">
            <select
              className="input-glass flex-1"
              value={t.kind}
              onChange={(e) => upd(i, { ...t, kind: e.target.value })}
            >
              {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <button onClick={() => del(i)} aria-label="Entfernen" className="text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
          <ConfigEditor value={t.config} onChange={(c) => upd(i, { ...t, config: c })} />
        </GlassPanel>
      ))}
      <GlassButton variant="ghost" onClick={add}>
        <Plus className="mr-1 h-4 w-4" /> Auslöser hinzufügen
      </GlassButton>
    </div>
  );
}

function ConditionsStep({ draft, patch }: { draft: Automation; patch: (p: Partial<Automation>) => void }) {
  const options = conditionRegistry.all();
  const root = draft.conditions;

  const setRoot = (n: ConditionNode | undefined) => patch({ conditions: n });

  const addRootAnd = () => setRoot({ id: createId("acn"), kind: "and", children: [] });
  const addLeaf = () => {
    const leaf: ConditionNode = { id: createId("acn"), kind: options[0]?.id ?? "custom", config: {} };
    if (!root) setRoot(leaf);
    else if (root.kind === "and" || root.kind === "or") {
      const n = root as { children: ConditionNode[] };
      setRoot({ ...root, children: [...n.children, leaf] } as ConditionNode);
    } else {
      setRoot({ id: createId("acn"), kind: "and", children: [root, leaf] });
    }
  };

  return (
    <div className="space-y-2">
      {!root && (
        <EmptyState title="Keine Bedingungen" description="Die Automation wird immer ausgeführt." />
      )}
      {root && <ConditionNodeEditor node={root} onChange={setRoot} onRemove={() => setRoot(undefined)} options={options.map((o) => ({ id: o.id, label: o.label }))} />}
      <div className="flex gap-2">
        <GlassButton variant="ghost" onClick={addLeaf}><Plus className="mr-1 h-4 w-4" /> Bedingung</GlassButton>
        {!root && (
          <GlassButton variant="ghost" onClick={addRootAnd}>UND-Gruppe</GlassButton>
        )}
      </div>
    </div>
  );
}

function ConditionNodeEditor({
  node,
  onChange,
  onRemove,
  options,
}: {
  node: ConditionNode;
  onChange: (n: ConditionNode) => void;
  onRemove: () => void;
  options: Array<{ id: string; label: string }>;
}) {
  if (node.kind === "and" || node.kind === "or") {
    const n = node as { id: string; kind: "and" | "or"; children: ConditionNode[] };
    return (
      <GlassPanel className="space-y-2 p-3">
        <div className="flex items-center gap-2">
          <select
            className="input-glass"
            value={n.kind}
            onChange={(e) => onChange({ ...n, kind: e.target.value as "and" | "or" } as ConditionNode)}
          >
            <option value="and">UND</option>
            <option value="or">ODER</option>
          </select>
          <button onClick={onRemove} className="ml-auto text-destructive"><Trash2 className="h-4 w-4" /></button>
        </div>
        <div className="space-y-2 pl-3">
          {n.children.map((c, i) => (
            <ConditionNodeEditor
              key={c.id}
              node={c}
              onChange={(nc) => onChange({ ...n, children: n.children.map((x, idx) => (idx === i ? nc : x)) } as ConditionNode)}
              onRemove={() => onChange({ ...n, children: n.children.filter((_, idx) => idx !== i) } as ConditionNode)}
              options={options}
            />
          ))}
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange({
                ...n,
                children: [...n.children, { id: createId("acn"), kind: options[0]?.id ?? "custom", config: {} } as ConditionNode],
              } as ConditionNode)
            }
          >
            <Plus className="mr-1 h-3 w-3" /> Bedingung
          </GlassButton>
        </div>
      </GlassPanel>
    );
  }
  if (node.kind === "not") {
    const n = node as { id: string; kind: "not"; child: ConditionNode };
    return (
      <GlassPanel className="space-y-2 p-3">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">NICHT</div>
          <button onClick={onRemove} className="ml-auto text-destructive"><Trash2 className="h-4 w-4" /></button>
        </div>
        <div className="pl-3">
          <ConditionNodeEditor node={n.child} onChange={(nc) => onChange({ ...n, child: nc })} onRemove={onRemove} options={options} />
        </div>
      </GlassPanel>
    );
  }
  const leaf = node as { id: string; kind: string; config: Record<string, unknown> };
  return (
    <GlassPanel className="space-y-2 p-3">
      <div className="flex items-center gap-2">
        <select
          className="input-glass flex-1"
          value={leaf.kind}
          onChange={(e) => onChange({ ...leaf, kind: e.target.value })}
        >
          {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <button onClick={onRemove} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
      </div>
      <ConfigEditor value={leaf.config} onChange={(c) => onChange({ ...leaf, config: c })} />
    </GlassPanel>
  );
}

function ActionsStep({ draft, patch }: { draft: Automation; patch: (p: Partial<Automation>) => void }) {
  const options = actionRegistry.all();
  const add = () => patch({ actions: [...draft.actions, { id: createId("aac"), kind: options[0]?.id ?? "custom", config: {} } as AutomationAction] });
  const upd = (i: number, a: AutomationAction) => patch({ actions: draft.actions.map((x, idx) => (idx === i ? a : x)) });
  const del = (i: number) => patch({ actions: draft.actions.filter((_, idx) => idx !== i) });
  const move = (i: number, dir: -1 | 1) => {
    const next = draft.actions.slice();
    const to = i + dir;
    if (to < 0 || to >= next.length) return;
    [next[i], next[to]] = [next[to], next[i]];
    patch({ actions: next });
  };

  return (
    <div className="space-y-2">
      {draft.actions.map((a, i) => (
        <GlassPanel key={a.id} className="space-y-2 p-3">
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">{i + 1}.</div>
            <select
              className="input-glass flex-1"
              value={a.kind}
              onChange={(e) => upd(i, { ...a, kind: e.target.value })}
            >
              {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <button onClick={() => move(i, -1)} className="text-muted-foreground">↑</button>
            <button onClick={() => move(i, 1)} className="text-muted-foreground">↓</button>
            <button onClick={() => del(i)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs">
              Delay (ms)
              <input
                className="input-glass"
                type="number"
                value={a.delayMs ?? 0}
                onChange={(e) => upd(i, { ...a, delayMs: parseInt(e.target.value, 10) || 0 })}
              />
            </label>
            <label className="text-xs">
              Fehlerstrategie
              <select
                className="input-glass"
                value={a.errorStrategy ?? "continue"}
                onChange={(e) => upd(i, { ...a, errorStrategy: e.target.value as AutomationAction["errorStrategy"] })}
              >
                <option value="continue">continue</option>
                <option value="abort">abort</option>
                <option value="retry">retry</option>
              </select>
            </label>
          </div>
          <ConfigEditor value={a.config} onChange={(c) => upd(i, { ...a, config: c })} />
        </GlassPanel>
      ))}
      <GlassButton variant="ghost" onClick={add}>
        <Plus className="mr-1 h-4 w-4" /> Aktion hinzufügen
      </GlassButton>
    </div>
  );
}

function ReviewStep({
  draft,
  validation,
}: {
  draft: Automation;
  validation: ReturnType<typeof validateAutomation> | null;
}) {
  return (
    <div className="space-y-2">
      <GlassCard>
        <div className="text-sm font-medium">{draft.name}</div>
        <div className="text-xs text-muted-foreground">{draft.description}</div>
      </GlassCard>
      <GlassCard>
        <div className="text-sm">Auslöser: {draft.triggers.length}</div>
        <div className="text-sm">Aktionen: {draft.actions.length}</div>
        <div className="text-sm">Bedingungen: {draft.conditions ? "vorhanden" : "keine"}</div>
      </GlassCard>
      {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
        <GlassPanel className="space-y-1 p-3 text-xs">
          {validation.errors.map((e, i) => (
            <div key={`e${i}`} className="text-destructive">✕ {e.path}: {e.message}</div>
          ))}
          {validation.warnings.map((w, i) => (
            <div key={`w${i}`} className="text-amber-400">! {w.path}: {w.message}</div>
          ))}
        </GlassPanel>
      )}
    </div>
  );
}

// -------- kleine Helfer --------

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs text-muted-foreground">
      <span>{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function ConfigEditor({ value, onChange }: { value: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void }) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [err, setErr] = useState<string | null>(null);
  return (
    <div>
      <textarea
        className="input-glass min-h-[80px] font-mono text-xs"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          try {
            const v = JSON.parse(e.target.value || "{}");
            if (v && typeof v === "object" && !Array.isArray(v)) {
              onChange(v as Record<string, unknown>);
              setErr(null);
            } else setErr("Config muss ein Objekt sein");
          } catch (parseErr) {
            setErr((parseErr as Error).message);
          }
        }}
      />
      {err && <div className="mt-1 text-[10px] text-destructive">{err}</div>}
    </div>
  );
}
