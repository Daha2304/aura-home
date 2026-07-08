import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Save, Trash2, AlertTriangle, Star } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { EmptyState } from "@/components/common/EmptyState";
import { useGroupsStore } from "@/store/slices/groupsStore";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { groupManager, groupResolver, groupExecutor } from "@/services/groups";
import type { DeviceGroupKind } from "@/models/deviceGroup";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/groups/$groupId")({
  head: () => ({ meta: [{ title: "Gruppe · Smart Home" }] }),
  component: GroupDetail,
});

const KINDS: DeviceGroupKind[] = [
  "light",
  "outlet",
  "blind",
  "thermostat",
  "sensor",
  "media",
  "mixed",
  "virtual",
  "dynamic",
];

function GroupDetail() {
  const { groupId } = Route.useParams();
  const navigate = useNavigate();
  const group = useGroupsStore((s) => s.byId[groupId]);
  const groups = useGroupsStore((s) => s.groups);
  const devices = useDevicesStore((s) => s.devices);

  const [name, setName] = useState(group?.name ?? "");
  const [kind, setKind] = useState<DeviceGroupKind>(group?.kind ?? "mixed");
  const [deviceIds, setDeviceIds] = useState<string[]>(group?.deviceIds ?? []);
  const [groupIds, setGroupIds] = useState<string[]>(group?.groupIds ?? []);
  const [capabilities, setCapabilities] = useState<string>(group?.capabilities.join(", ") ?? "");
  const [error, setError] = useState<string | null>(null);

  const expanded = useMemo(() => (group ? groupResolver.expand(group.id) : []), [group, groups]);

  if (!group) {
    return (
      <>
        <Link to="/groups" className="mb-2 inline-flex items-center gap-1 text-sm text-accent">
          <ChevronLeft className="h-4 w-4" /> Gruppen
        </Link>
        <EmptyState title="Gruppe nicht gefunden" />
      </>
    );
  }

  const toggleDevice = (id: string) =>
    setDeviceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleChildGroup = (id: string) => {
    setError(null);
    const next = groupIds.includes(id) ? groupIds.filter((x) => x !== id) : [...groupIds, id];
    // Live cycle-check
    if (groupResolver.wouldCycle(group.id, next)) {
      setError("Diese Auswahl würde einen Zyklus zwischen Gruppen erzeugen.");
      return;
    }
    setGroupIds(next);
  };

  const save = () => {
    const res = groupManager.setChildren(group.id, {
      deviceIds,
      groupIds,
      capabilities: capabilities
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
    });
    if (!res.ok) {
      setError(res.reason === "cycle" ? "Zyklus – nicht gespeichert." : "Gruppe nicht gefunden.");
      return;
    }
    groupManager.update(group.id, { name: name.trim() || group.name, kind });
    navigate({ to: "/groups" });
  };

  return (
    <>
      <Link to="/groups" className="mb-2 inline-flex items-center gap-1 text-sm text-accent">
        <ChevronLeft className="h-4 w-4" /> Gruppen
      </Link>
      <PageHeader
        title={group.name}
        subtitle={`${expanded.length} Gerät${expanded.length === 1 ? "" : "e"} · ${group.groupIds.length} Untergruppen`}
        trailing={
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => groupManager.toggleFavorite(group.id)}
            aria-label={group.favorite ? "Favorit entfernen" : "Favorit"}
          >
            <Star className="h-4 w-4" fill={group.favorite ? "currentColor" : "none"} />
          </GlassButton>
        }
      />

      <GlassPanel className="mb-3 space-y-3">
        <label className="block">
          <div className="mb-1 text-xs font-medium text-muted-foreground">Name</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <div>
          <div className="mb-1 text-xs font-medium text-muted-foreground">Art</div>
          <div className="flex flex-wrap gap-1.5">
            {KINDS.map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={cn(
                  "h-8 rounded-full px-3 text-xs",
                  kind === k ? "bg-primary text-primary-foreground" : "border border-border bg-background/40",
                )}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <div className="mb-1 text-xs font-medium text-muted-foreground">
            Capabilities (komma-getrennt, für generische Fan-out-Ausführung)
          </div>
          <input
            value={capabilities}
            onChange={(e) => setCapabilities(e.target.value)}
            placeholder="power, brightness"
            className="w-full rounded-lg bg-background/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
      </GlassPanel>

      {error && (
        <GlassCard className="mb-3 flex items-center gap-2 border border-destructive/40 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </GlassCard>
      )}

      <div className="mb-2 text-sm font-semibold">Untergruppen</div>
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {groups.filter((g) => g.id !== group.id).map((g) => {
          const active = groupIds.includes(g.id);
          const wouldCycle = !active && groupResolver.wouldCycle(group.id, [...groupIds, g.id]);
          return (
            <button
              key={g.id}
              type="button"
              disabled={wouldCycle}
              onClick={() => toggleChildGroup(g.id)}
              className={cn(
                "glass-card flex items-center justify-between p-2 text-left text-sm",
                active && "ring-2 ring-primary",
                wouldCycle && "opacity-40",
              )}
            >
              <div>
                <div className="font-medium">{g.name}</div>
                <div className="text-xs text-muted-foreground">
                  {g.kind}{wouldCycle ? " · Zyklus" : ""}
                </div>
              </div>
              <input readOnly type="checkbox" checked={active} className="pointer-events-none" />
            </button>
          );
        })}
      </div>

      <div className="mb-2 text-sm font-semibold">Geräte</div>
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {devices.map((d) => {
          const active = deviceIds.includes(d.id);
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => toggleDevice(d.id)}
              className={cn(
                "glass-card flex items-center justify-between p-2 text-left text-sm",
                active && "ring-2 ring-primary",
              )}
            >
              <div>
                <div className="truncate font-medium">{d.name}</div>
                <div className="text-xs text-muted-foreground">{d.type}</div>
              </div>
              <input readOnly type="checkbox" checked={active} className="pointer-events-none" />
            </button>
          );
        })}
      </div>

      {group.capabilities.length > 0 && (
        <>
          <div className="mb-2 text-sm font-semibold">Schnellaktionen</div>
          <div className="mb-4 flex flex-wrap gap-2">
            {group.capabilities.map((cap) => (
              <button
                key={cap}
                onClick={() => groupExecutor.apply(group.id, cap, true)}
                className="rounded-full border border-border bg-background/40 px-3 py-1 text-xs"
              >
                {cap} → on
              </button>
            ))}
          </div>
        </>
      )}

      <div className="sticky bottom-4 flex justify-between">
        <button
          type="button"
          onClick={() => {
            if (confirm("Gruppe wirklich löschen?")) {
              groupManager.delete(group.id);
              navigate({ to: "/groups" });
            }
          }}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-destructive/10 px-4 text-sm font-medium text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Löschen
        </button>
        <GlassButton variant="primary" size="lg" onClick={save}>
          <Save className="h-4 w-4" />
          Speichern
        </GlassButton>
      </div>
    </>
  );
}
