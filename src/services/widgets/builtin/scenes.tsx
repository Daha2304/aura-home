import { widgetRegistry } from "@/services/widgets/WidgetRegistry";
import { defineWidget, type WidgetDescriptor } from "@/models/widgetDescriptor";
import { Sparkles, Play, Star } from "lucide-react";
import { useScenesStore } from "@/store/slices/scenesStore";
import { useSceneExecutionsStore, selectLatestExecution } from "@/store/slices/sceneExecutionsStore";
import { sceneExecutor } from "@/services/scenes";

function SceneButtonWidget({ sceneId }: { sceneId?: string }) {
  const scene = useScenesStore((s) => (sceneId ? s.byId[sceneId] : undefined));
  const latest = useSceneExecutionsStore(selectLatestExecution(sceneId ?? ""));
  if (!scene) {
    return (
      <div className="grid h-full place-items-center p-4 text-sm text-muted-foreground">
        Szene wählen
      </div>
    );
  }
  const running = latest?.status === "running" || latest?.status === "planned";
  return (
    <button
      type="button"
      onClick={() => sceneExecutor.run(scene.id)}
      disabled={running}
      className="flex h-full w-full flex-col items-start justify-between p-4 text-left"
      aria-label={`Szene ${scene.name}`}
    >
      <div className="inline-grid h-10 w-10 place-items-center rounded-2xl bg-accent/20 text-accent">
        <Sparkles className="h-5 w-5" />
      </div>
      <div>
        <div className="text-base font-semibold">{scene.name}</div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Play className="h-3 w-3" /> {running ? "läuft…" : "tippen zum Ausführen"}
        </div>
      </div>
    </button>
  );
}

function SceneGridWidget() {
  const scenes = useScenesStore((s) => s.scenes.slice(0, 6));
  return (
    <div className="grid h-full grid-cols-2 gap-2 p-3">
      {scenes.map((s) => (
        <button
          key={s.id}
          onClick={() => sceneExecutor.run(s.id)}
          className="glass-panel flex flex-col items-start justify-between p-3 text-left"
        >
          <Sparkles className="h-4 w-4 text-accent" />
          <div className="truncate text-xs font-medium">{s.name}</div>
        </button>
      ))}
    </div>
  );
}

function SceneFavoritesWidget() {
  const scenes = useScenesStore((s) => s.scenes.filter((x) => x.favorite));
  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
        <Star className="h-4 w-4" /> Favoriten
      </div>
      <div className="flex-1 space-y-1 overflow-hidden">
        {scenes.length === 0 && <div className="text-xs text-muted-foreground">Keine Favoriten</div>}
        {scenes.slice(0, 4).map((s) => (
          <button
            key={s.id}
            onClick={() => sceneExecutor.run(s.id)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-white/5"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span className="truncate">{s.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SceneStatusWidget() {
  const active = useSceneExecutionsStore((s) => s.active);
  return (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4" /> Szenen
      </div>
      <div>
        <div className="text-3xl font-semibold">{active.length}</div>
        <div className="text-xs text-muted-foreground">aktive Ausführungen</div>
      </div>
    </div>
  );
}

const descriptors: WidgetDescriptor[] = [
  defineWidget({
    id: "scene.button",
    name: "Szenen-Button",
    category: "scenes",
    description: "Startet eine Szene mit einem Tap.",
    icon: "sparkles",
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
    settings: [{ key: "sceneId", label: "Szene", type: "scene" }],
    capabilities: ["themeable", "movable", "resizable", "configurable"],
    version: 1,
    render: ({ instance }) => <SceneButtonWidget sceneId={instance.config?.sceneId as string | undefined} />,
  }),
  defineWidget({
    id: "scene.grid",
    name: "Szenen-Grid",
    category: "scenes",
    description: "Kompaktes Raster aller Szenen.",
    icon: "grid",
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
    render: () => <SceneGridWidget />,
  }),
  defineWidget({
    id: "scene.favorites",
    name: "Szenen-Favoriten",
    category: "scenes",
    description: "Bevorzugte Szenen im Schnellzugriff.",
    icon: "star",
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
    settings: [],
    capabilities: ["themeable", "movable", "resizable"],
    version: 1,
    render: () => <SceneFavoritesWidget />,
  }),
  defineWidget({
    id: "scene.status",
    name: "Szenenstatus",
    category: "scenes",
    description: "Anzahl laufender Szenen.",
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
    render: () => <SceneStatusWidget />,
  }),
];

let registered = false;
export function registerSceneWidgets(): void {
  if (registered) return;
  registered = true;
  for (const d of descriptors) widgetRegistry.register(d);
}

export const SCENE_WIDGET_IDS = descriptors.map((d) => d.id);
