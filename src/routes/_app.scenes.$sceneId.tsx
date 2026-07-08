import { useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronLeft, Play, Pencil, Star, Trash2, Undo2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { GlassButton } from "@/components/glass/GlassButton";
import { EmptyState } from "@/components/common/EmptyState";
import { useScenesStore } from "@/store/slices/scenesStore";
import { useSceneExecutionsStore, selectExecutionsForScene, selectLatestExecution } from "@/store/slices/sceneExecutionsStore";
import { useSceneVersionsStore } from "@/store/slices/sceneVersionsStore";
import { sceneExecutor, sceneManager } from "@/services/scenes";

export const Route = createFileRoute("/_app/scenes/$sceneId")({
  head: () => ({ meta: [{ title: "Szene · Smart Home" }] }),
  component: SceneDetail,
});

function SceneDetail() {
  const { sceneId } = Route.useParams();
  const navigate = useNavigate();
  const scene = useScenesStore((s) => s.byId[sceneId]);
  const latest = useSceneExecutionsStore(selectLatestExecution(sceneId));
  const executions = useSceneExecutionsStore(selectExecutionsForScene(sceneId));
  const versions = useSceneVersionsStore((s) => s.byScene[sceneId] ?? []);

  const progressPct = useMemo(() => {
    if (!latest || latest.progress.total === 0) return 0;
    const done = latest.progress.completed + latest.progress.failed + latest.progress.cancelled;
    return Math.round((done / latest.progress.total) * 100);
  }, [latest]);

  if (!scene) {
    return (
      <>
        <Link to="/scenes" className="mb-2 inline-flex items-center gap-1 text-sm text-accent">
          <ChevronLeft className="h-4 w-4" /> Szenen
        </Link>
        <EmptyState title="Szene nicht gefunden" description="Diese Szene wurde entfernt oder existiert nicht mehr." />
      </>
    );
  }

  return (
    <>
      <Link to="/scenes" className="mb-2 inline-flex items-center gap-1 text-sm text-accent">
        <ChevronLeft className="h-4 w-4" /> Szenen
      </Link>
      <PageHeader
        title={scene.name}
        subtitle={scene.description ?? `${scene.actions.length} Aktionen · Version ${scene.version}`}
      />

      <GlassPanel className="mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <GlassButton
            variant="primary"
            size="md"
            onClick={() => sceneExecutor.run(scene.id)}
            aria-label="Szene ausführen"
          >
            <Play className="h-4 w-4" fill="currentColor" />
            Ausführen
          </GlassButton>
          <GlassButton
            variant="ghost"
            size="md"
            onClick={() => navigate({ to: "/scenes/$sceneId/edit", params: { sceneId: scene.id } })}
          >
            <Pencil className="h-4 w-4" />
            Bearbeiten
          </GlassButton>
          <GlassButton
            variant="ghost"
            size="md"
            onClick={() => sceneManager.toggleFavorite(scene.id)}
            aria-label={scene.favorite ? "Favorit entfernen" : "Als Favorit markieren"}
          >
            <Star className="h-4 w-4" fill={scene.favorite ? "currentColor" : "none"} />
            Favorit
          </GlassButton>
          <button
            type="button"
            title="Undo ist für spätere Automations-Integration vorbereitet"
            disabled
            className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-4 text-[15px] text-muted-foreground opacity-60"
          >
            <Undo2 className="h-4 w-4" />
            Undo (vorbereitet)
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm("Szene wirklich löschen?")) {
                sceneManager.delete(scene.id);
                navigate({ to: "/scenes" });
              }
            }}
            className="ml-auto inline-flex h-11 items-center gap-2 rounded-full bg-destructive/10 px-4 text-sm font-medium text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Löschen
          </button>
        </div>
        {latest && (
          <div className="mt-3">
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="font-medium">
                Letzte Ausführung · {latest.status}
              </span>
              <span className="text-muted-foreground">
                {latest.progress.completed}/{latest.progress.total} erledigt
                {latest.progress.failed > 0 ? ` · ${latest.progress.failed} fehlgeschlagen` : ""}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full bg-accent"
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}
      </GlassPanel>

      <div className="mb-2 text-sm font-semibold">Aktionen</div>
      {scene.actions.length === 0 ? (
        <EmptyState title="Keine Aktionen" description="Öffne den Editor, um Geräte oder Gruppen hinzuzufügen." />
      ) : (
        <div className="mb-4 space-y-2">
          {scene.actions.map((a, i) => (
            <GlassCard key={a.id} className="text-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-medium">
                    #{i + 1} · {a.deviceId ? "Gerät" : a.groupId ? "Gruppe" : "—"} · {a.capabilityId}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    Wert: {formatValue(a.targetValue)}
                    {a.delayMs ? ` · Verzögerung ${a.delayMs} ms` : ""}
                    {a.parallel ? " · parallel" : " · sequenziell"}
                    {a.optional ? " · optional" : ""}
                    {` · ${a.errorStrategy}`}
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <div className="mb-2 text-sm font-semibold">Versionen</div>
      {versions.length === 0 ? (
        <div className="text-xs text-muted-foreground">Keine gespeicherten Versionen.</div>
      ) : (
        <div className="space-y-2">
          {versions.map((v) => (
            <GlassCard key={v.id} className="text-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-medium">Version {v.versionNumber}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(v.createdAt).toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-border px-3 py-1 text-xs"
                  onClick={() => sceneManager.restoreVersion(scene.id, v.versionNumber)}
                  disabled={v.versionNumber === scene.version}
                >
                  {v.versionNumber === scene.version ? "aktuell" : "wiederherstellen"}
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {executions.length > 0 && (
        <>
          <div className="mt-4 mb-2 text-sm font-semibold">Ausführungshistorie</div>
          <div className="space-y-2">
            {executions.slice(0, 10).map((e) => (
              <GlassCard key={e.id} className="text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{e.status}</span>
                  <span className="text-muted-foreground">
                    {new Date(e.startedAt).toLocaleString()} · {e.progress.completed}/{e.progress.total}
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}
