import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, GripVertical, Plus, Save, Trash2, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { EmptyState } from "@/components/common/EmptyState";
import { useScenesStore } from "@/store/slices/scenesStore";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { useGroupsStore } from "@/store/slices/groupsStore";
import { sceneManager } from "@/services/scenes";
import type { SceneAction, SceneCategory, SceneErrorStrategy } from "@/models/scene";
import { createId } from "@/utils/ids";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/scenes/$sceneId/edit")({
  head: () => ({ meta: [{ title: "Szene bearbeiten · Smart Home" }] }),
  component: SceneEditor,
});

const CATEGORIES: Array<{ id: SceneCategory; label: string }> = [
  { id: "light", label: "Licht" },
  { id: "climate", label: "Klima" },
  { id: "tv", label: "TV" },
  { id: "music", label: "Musik" },
  { id: "away", label: "Verlassen" },
  { id: "home", label: "Nach Hause" },
  { id: "sleep", label: "Schlafen" },
  { id: "wake", label: "Aufstehen" },
  { id: "custom", label: "Eigene" },
];

const STRATEGIES: SceneErrorStrategy[] = ["abort", "continue", "retry"];

function SceneEditor() {
  const { sceneId } = Route.useParams();
  const navigate = useNavigate();
  const scene = useScenesStore((s) => s.byId[sceneId]);
  const devices = useDevicesStore((s) => s.devices);
  const groups = useGroupsStore((s) => s.groups);

  const [name, setName] = useState(scene?.name ?? "");
  const [description, setDescription] = useState(scene?.description ?? "");
  const [category, setCategory] = useState<SceneCategory>(scene?.category ?? "custom");
  const [tags, setTags] = useState(scene?.tags.join(", ") ?? "");
  const [actions, setActions] = useState<SceneAction[]>(scene?.actions ?? []);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQ, setPickerQ] = useState("");

  const filteredDevices = useMemo(() => {
    const t = pickerQ.trim().toLowerCase();
    return devices.filter((d) => !t || d.name.toLowerCase().includes(t));
  }, [devices, pickerQ]);
  const filteredGroups = useMemo(() => {
    const t = pickerQ.trim().toLowerCase();
    return groups.filter((g) => !t || g.name.toLowerCase().includes(t));
  }, [groups, pickerQ]);

  if (!scene) {
    return (
      <>
        <Link to="/scenes" className="mb-2 inline-flex items-center gap-1 text-sm text-accent">
          <ChevronLeft className="h-4 w-4" /> Szenen
        </Link>
        <EmptyState title="Szene nicht gefunden" />
      </>
    );
  }

  const save = () => {
    sceneManager.update(scene.id, {
      name: name.trim() || scene.name,
      description: description.trim() || undefined,
      category,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      actions,
    });
    navigate({ to: "/scenes/$sceneId", params: { sceneId: scene.id } });
  };

  const addAction = (target: { deviceId?: string; groupId?: string; capabilityId: string; sampleValue: unknown }) => {
    setActions((prev) => [
      ...prev,
      {
        id: createId("sa"),
        deviceId: target.deviceId,
        groupId: target.groupId,
        capabilityId: target.capabilityId,
        targetValue: target.sampleValue,
        delayMs: 0,
        priority: prev.length,
        parallel: true,
        optional: false,
        errorStrategy: "continue",
      },
    ]);
    setPickerOpen(false);
    setPickerQ("");
  };

  const patchAction = (id: string, patch: Partial<SceneAction>) => {
    setActions((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };
  const removeAction = (id: string) => setActions((prev) => prev.filter((a) => a.id !== id));

  const onDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    setActions((prev) => {
      const list = prev.slice();
      const [item] = list.splice(dragIndex, 1);
      list.splice(targetIndex, 0, item);
      return list;
    });
    setDragIndex(null);
  };

  return (
    <>
      <Link to="/scenes/$sceneId" params={{ sceneId }} className="mb-2 inline-flex items-center gap-1 text-sm text-accent">
        <ChevronLeft className="h-4 w-4" /> Zurück
      </Link>
      <PageHeader title="Szene bearbeiten" subtitle={scene.name} />

      <GlassPanel className="mb-3 space-y-3">
        <label className="block">
          <div className="mb-1 text-xs font-medium text-muted-foreground">Name</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="block">
          <div className="mb-1 text-xs font-medium text-muted-foreground">Beschreibung</div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <div>
          <div className="mb-1 text-xs font-medium text-muted-foreground">Kategorie</div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={cn(
                  "h-8 rounded-full px-3 text-xs",
                  category === c.id ? "bg-primary text-primary-foreground" : "border border-border bg-background/40",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <div className="mb-1 text-xs font-medium text-muted-foreground">Tags (komma-getrennt)</div>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full rounded-lg bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
      </GlassPanel>

      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold">Aktionen</div>
        <GlassButton variant="ghost" size="sm" onClick={() => setPickerOpen(true)}>
          <Plus className="h-4 w-4" /> Hinzufügen
        </GlassButton>
      </div>

      {actions.length === 0 ? (
        <EmptyState title="Keine Aktionen" description="Füge Geräte oder Gruppen hinzu, um die Szene zu definieren." />
      ) : (
        <div className="mb-4 space-y-2">
          {actions.map((a, i) => {
            const device = a.deviceId ? devices.find((d) => d.id === a.deviceId) : undefined;
            const group = a.groupId ? groups.find((g) => g.id === a.groupId) : undefined;
            return (
              <div
                key={a.id}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(i)}
                className={cn("transition-opacity", dragIndex === i && "opacity-50")}
              >
                <GlassCard className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <GripVertical className="mt-0.5 h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">
                        #{i + 1} · {device?.name ?? group?.name ?? "—"} · {a.capabilityId}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAction(a.id)}
                      className="rounded-full p-1 text-destructive hover:bg-destructive/10"
                      aria-label="Aktion entfernen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <div className="text-[11px] text-muted-foreground">Zielwert</div>
                      <input
                        value={typeof a.targetValue === "object" ? JSON.stringify(a.targetValue) : String(a.targetValue ?? "")}
                        onChange={(e) => {
                          const raw = e.target.value;
                          let parsed: unknown = raw;
                          if (raw === "true") parsed = true;
                          else if (raw === "false") parsed = false;
                          else if (raw !== "" && !Number.isNaN(Number(raw))) parsed = Number(raw);
                          patchAction(a.id, { targetValue: parsed });
                        }}
                        className="w-full rounded bg-background/60 px-2 py-1 text-xs"
                      />
                    </label>
                    <label className="block">
                      <div className="text-[11px] text-muted-foreground">Verzögerung (ms)</div>
                      <input
                        type="number"
                        min={0}
                        value={a.delayMs}
                        onChange={(e) => patchAction(a.id, { delayMs: Math.max(0, Number(e.target.value) || 0) })}
                        className="w-full rounded bg-background/60 px-2 py-1 text-xs"
                      />
                    </label>
                    <label className="block">
                      <div className="text-[11px] text-muted-foreground">Priorität</div>
                      <input
                        type="number"
                        value={a.priority}
                        onChange={(e) => patchAction(a.id, { priority: Number(e.target.value) || 0 })}
                        className="w-full rounded bg-background/60 px-2 py-1 text-xs"
                      />
                    </label>
                    <label className="block">
                      <div className="text-[11px] text-muted-foreground">Fehlerstrategie</div>
                      <select
                        value={a.errorStrategy}
                        onChange={(e) => patchAction(a.id, { errorStrategy: e.target.value as SceneErrorStrategy })}
                        className="w-full rounded bg-background/60 px-2 py-1 text-xs"
                      >
                        {STRATEGIES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={a.parallel}
                        onChange={(e) => patchAction(a.id, { parallel: e.target.checked })}
                      />
                      Parallel
                    </label>
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={a.optional}
                        onChange={(e) => patchAction(a.id, { optional: e.target.checked })}
                      />
                      Optional
                    </label>
                  </div>
                </GlassCard>
              </div>
            );
          })}
        </div>
      )}

      <div className="sticky bottom-4 mt-4 flex justify-end">
        <GlassButton variant="primary" size="lg" onClick={save}>
          <Save className="h-4 w-4" />
          Speichern
        </GlassButton>
      </div>

      {pickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="glass-card w-full max-w-md space-y-3 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-semibold">Gerät oder Gruppe wählen</div>
            <div className="glass-card flex items-center gap-2 px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                autoFocus
                value={pickerQ}
                onChange={(e) => setPickerQ(e.target.value)}
                placeholder="Suchen"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {filteredGroups.length > 0 && (
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Gruppen</div>
              )}
              {filteredGroups.map((g) => (
                <div key={g.id} className="glass-card p-2">
                  <div className="mb-1 text-sm font-medium">{g.name}</div>
                  <div className="flex flex-wrap gap-1">
                    {(g.capabilities.length > 0 ? g.capabilities : ["power"]).map((cap) => (
                      <button
                        key={cap}
                        onClick={() => addAction({ groupId: g.id, capabilityId: cap, sampleValue: true })}
                        className="rounded-full border border-border bg-background/40 px-2 py-0.5 text-xs"
                      >
                        {cap}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {filteredDevices.length > 0 && (
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Geräte</div>
              )}
              {filteredDevices.map((d) => (
                <div key={d.id} className="glass-card p-2">
                  <div className="mb-1 text-sm font-medium">{d.name}</div>
                  <div className="flex flex-wrap gap-1">
                    {(d.capabilities ?? []).map((cap) => (
                      <button
                        key={cap.id}
                        onClick={() =>
                          addAction({
                            deviceId: d.id,
                            capabilityId: cap.id,
                            sampleValue: (cap as { value?: unknown }).value ?? true,
                          })
                        }
                        className="rounded-full border border-border bg-background/40 px-2 py-0.5 text-xs"
                      >
                        {cap.id}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {filteredDevices.length === 0 && filteredGroups.length === 0 && (
                <div className="p-3 text-center text-xs text-muted-foreground">
                  Keine Treffer
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
