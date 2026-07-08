import { widgetRegistry } from "@/services/widgets/WidgetRegistry";
import { defineWidget, type WidgetDescriptor } from "@/models/widgetDescriptor";
import { Layers, Zap } from "lucide-react";
import { useGroupsStore } from "@/store/slices/groupsStore";
import { useGroupExecutionsStore } from "@/store/slices/groupExecutionsStore";
import { groupExecutor, groupResolver } from "@/services/groups";

function GroupControlWidget({ groupId }: { groupId?: string }) {
  const revision = useGroupsStore((s) => s.revision);
  const group = useGroupsStore((s) => (groupId ? s.byId[groupId] : undefined));
  const exec = useGroupExecutionsStore((s) => (groupId ? s.byGroup[groupId] : undefined));
  if (!group) {
    return (
      <div className="grid h-full place-items-center p-4 text-sm text-muted-foreground">
        Gruppe wählen
      </div>
    );
  }
  void revision;
  const size = groupResolver.expand(group.id).length;
  return (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Layers className="h-4 w-4" /> {group.name}
      </div>
      <div>
        <div className="text-2xl font-semibold">{size}</div>
        <div className="text-xs text-muted-foreground">Geräte · {group.kind}</div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(group.capabilities.length > 0 ? group.capabilities : ["power"]).slice(0, 3).map((cap) => (
          <button
            key={cap}
            onClick={() => groupExecutor.apply(group.id, cap, true)}
            className="rounded-full border border-border bg-background/40 px-2 py-0.5 text-[11px]"
          >
            {cap}
          </button>
        ))}
      </div>
      {exec && exec.status === "running" && (
        <div className="text-[11px] text-muted-foreground">
          {exec.completed}/{exec.total} erledigt
        </div>
      )}
    </div>
  );
}

function GroupStatusWidget() {
  const groups = useGroupsStore((s) => s.groups);
  return (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Layers className="h-4 w-4" /> Gruppen
      </div>
      <div>
        <div className="text-3xl font-semibold">{groups.length}</div>
        <div className="text-xs text-muted-foreground">insgesamt</div>
      </div>
    </div>
  );
}

function QuickActionsWidget() {
  const groups = useGroupsStore((s) => s.groups.filter((g) => g.favorite).slice(0, 6));
  return (
    <div className="grid h-full grid-cols-2 gap-2 p-3">
      {groups.map((g) => (
        <button
          key={g.id}
          onClick={() => groupExecutor.apply(g.id, g.capabilities[0] ?? "power", true)}
          className="glass-panel flex flex-col items-start justify-between p-3 text-left"
        >
          <Zap className="h-4 w-4 text-accent" />
          <div className="truncate text-xs font-medium">{g.name}</div>
        </button>
      ))}
      {groups.length === 0 && (
        <div className="col-span-2 grid place-items-center text-xs text-muted-foreground">
          Favoriten in Gruppen markieren
        </div>
      )}
    </div>
  );
}

const descriptors: WidgetDescriptor[] = [
  defineWidget({
    id: "group.control",
    name: "Gruppen-Steuerung",
    category: "devices",
    description: "Fan-out über eine Gerätegruppe.",
    icon: "layers",
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    maxSize: { w: 8, h: 4 },
    supportedLayouts: [
      "phone-portrait",
      "phone-landscape",
      "tablet-portrait",
      "tablet-landscape",
      "desktop",
    ],
    settings: [{ key: "groupId", label: "Gruppe", type: "group" }],
    capabilities: ["themeable", "movable", "resizable", "configurable"],
    version: 1,
    render: ({ instance }) => <GroupControlWidget groupId={instance.config?.groupId as string | undefined} />,
  }),
  defineWidget({
    id: "group.status",
    name: "Gruppenstatus",
    category: "devices",
    description: "Anzahl der Gerätegruppen.",
    icon: "activity",
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 6, h: 3 },
    supportedLayouts: [
      "phone-portrait",
      "phone-landscape",
      "tablet-portrait",
      "tablet-landscape",
      "desktop",
    ],
    settings: [],
    capabilities: ["themeable", "movable", "resizable"],
    version: 1,
    render: () => <GroupStatusWidget />,
  }),
  defineWidget({
    id: "quick.actions",
    name: "Schnellaktionen",
    category: "favorites",
    description: "Favorisierte Gruppen als Ein-Tap-Aktionen.",
    icon: "zap",
    defaultSize: { w: 6, h: 3 },
    minSize: { w: 4, h: 2 },
    maxSize: { w: 12, h: 5 },
    supportedLayouts: [
      "phone-portrait",
      "phone-landscape",
      "tablet-portrait",
      "tablet-landscape",
      "desktop",
    ],
    settings: [],
    capabilities: ["themeable", "movable", "resizable"],
    version: 1,
    render: () => <QuickActionsWidget />,
  }),
];

let registered = false;
export function registerGroupWidgets(): void {
  if (registered) return;
  registered = true;
  for (const d of descriptors) widgetRegistry.register(d);
}

export const GROUP_WIDGET_IDS = descriptors.map((d) => d.id);
