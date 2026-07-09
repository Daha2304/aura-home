import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { ChevronLeft, Play, Pencil, Star, Trash2, Undo2, Copy, Download } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { GlassButton } from "@/components/glass/GlassButton";
import { EmptyState } from "@/components/common/EmptyState";
import { Switch } from "@/components/ui/switch";
import { useAutomationsStore } from "@/store/slices/automationsStore";
import {
  useAutomationExecutionsStore,
  selectExecutionsForAutomation,
  selectLatestAutomationExecution,
} from "@/store/slices/automationExecutionsStore";
import { useAutomationVersionsStore } from "@/store/slices/automationVersionsStore";
import {
  automationExecutor,
  automationManager,
  exportAutomations,
  validateAutomation,
} from "@/services/automations";

export const Route = createFileRoute("/_app/automations/$automationId")({
  head: () => ({ meta: [{ title: "Automation · Smart Home" }] }),
  component: AutomationDetail,
});

function AutomationDetail() {
  const { automationId } = Route.useParams();
  const navigate = useNavigate();
  const a = useAutomationsStore((s) => s.byId[automationId]);
  const latest = useAutomationExecutionsStore(selectLatestAutomationExecution(automationId));
  const executions = useAutomationExecutionsStore(selectExecutionsForAutomation(automationId));
  const versions = useAutomationVersionsStore((s) => s.byAutomation[automationId] ?? []);

  const validation = useMemo(() => (a ? validateAutomation(a) : null), [a]);

  const progressPct = useMemo(() => {
    if (!latest || latest.progress.total === 0) return 0;
    const done = latest.progress.completed + latest.progress.failed + latest.progress.cancelled;
    return Math.min(1, done / latest.progress.total);
  }, [latest]);

  if (!a) {
    return (
      <>
        <PageHeader title="Automation" />
        <EmptyState title="Nicht gefunden" description="Diese Automation existiert nicht mehr." />
      </>
    );
  }

  const doExport = () => {
    const bundle = exportAutomations();
    bundle.automations = bundle.automations.filter((x) => x.id === a.id);
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${a.name.replace(/\s+/g, "-")}.automation.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        title={a.name}
        subtitle={`${a.triggers.length} Auslöser · ${a.actions.length} Aktionen`}
        trailing={
          <div className="flex items-center gap-1.5">
            <Link to="/automations" aria-label="Zurück">
              <GlassButton variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4" />
              </GlassButton>
            </Link>
            <GlassButton
              variant="ghost"
              size="sm"
              aria-label="Favorit"
              onClick={() => automationManager.toggleFavorite(a.id)}
            >
              <Star className={a.favorite ? "h-4 w-4 fill-amber-400 text-amber-400" : "h-4 w-4"} />
            </GlassButton>
            <GlassButton
              variant="ghost"
              size="sm"
              aria-label="Bearbeiten"
              onClick={() =>
                navigate({ to: "/automations/$automationId/edit", params: { automationId: a.id } })
              }
            >
              <Pencil className="h-4 w-4" />
            </GlassButton>
          </div>
        }
      />

      <GlassCard className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground">Aktiv</div>
          <div className="truncate text-lg font-semibold">
            {a.enabled ? "Aktiviert" : "Deaktiviert"}
          </div>
        </div>
        <Switch
          checked={a.enabled}
          onCheckedChange={(v) => automationManager.setEnabled(a.id, v)}
          aria-label="Automation aktiv"
        />
      </GlassCard>

      <GlassCard className="mb-3">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Letzte Ausführung</div>
            <div className="text-lg font-semibold capitalize">{latest?.status ?? "keine"}</div>
          </div>
          <GlassButton
            variant="primary"
            size="sm"
            disabled={!a.enabled}
            onClick={() => automationExecutor.run(a.id, { triggerId: "manual" })}
          >
            <Play className="mr-1 h-4 w-4" fill="currentColor" /> Auslösen
          </GlassButton>
        </div>
        {latest && (
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full bg-accent"
              animate={{ width: `${progressPct * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </GlassCard>

      {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
        <GlassPanel className="mb-3 space-y-1 p-3 text-xs">
          {validation.errors.map((e, i) => (
            <div key={`e${i}`} className="text-destructive">✕ {e.path}: {e.message}</div>
          ))}
          {validation.warnings.map((w, i) => (
            <div key={`w${i}`} className="text-amber-400">! {w.path}: {w.message}</div>
          ))}
        </GlassPanel>
      )}

      <SectionTitle>Auslöser</SectionTitle>
      {a.triggers.length === 0 ? (
        <div className="mb-3 text-xs text-muted-foreground">Keine Auslöser konfiguriert.</div>
      ) : (
        <div className="mb-3 space-y-1.5">
          {a.triggers.map((t) => (
            <GlassPanel key={t.id} className="p-3 text-sm">
              <div className="font-medium">{t.kind}</div>
              <div className="text-xs text-muted-foreground">
                {Object.keys(t.config).length} Parameter
              </div>
            </GlassPanel>
          ))}
        </div>
      )}

      <SectionTitle>Aktionen</SectionTitle>
      {a.actions.length === 0 ? (
        <div className="mb-3 text-xs text-muted-foreground">Keine Aktionen konfiguriert.</div>
      ) : (
        <div className="mb-3 space-y-1.5">
          {a.actions.map((x, i) => (
            <GlassPanel key={x.id} className="p-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  {i + 1}. {x.kind}
                </div>
                {x.delayMs && x.delayMs > 0 && (
                  <div className="text-xs text-muted-foreground">Delay {x.delayMs}ms</div>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {Object.keys(x.config).length} Parameter
              </div>
            </GlassPanel>
          ))}
        </div>
      )}

      <SectionTitle>Verlauf</SectionTitle>
      {executions.length === 0 ? (
        <div className="mb-3 text-xs text-muted-foreground">Noch keine Ausführungen.</div>
      ) : (
        <div className="mb-3 space-y-1.5">
          {executions.slice(0, 8).map((e) => (
            <GlassPanel key={e.id} className="flex items-center justify-between p-3 text-xs">
              <div>
                <div className="font-medium capitalize">{e.status}</div>
                <div className="text-muted-foreground">
                  {new Date(e.startedAt).toLocaleString()}
                </div>
              </div>
              <div className="text-muted-foreground">
                {e.progress.completed}/{e.progress.total}
              </div>
            </GlassPanel>
          ))}
        </div>
      )}

      <SectionTitle>Versionen</SectionTitle>
      {versions.length === 0 ? (
        <div className="mb-3 text-xs text-muted-foreground">Keine Versionen.</div>
      ) : (
        <div className="mb-3 space-y-1.5">
          {versions.slice(0, 10).map((v) => (
            <GlassPanel key={v.id} className="flex items-center justify-between p-3 text-xs">
              <div>
                <div className="font-medium">v{v.versionNumber}</div>
                <div className="text-muted-foreground">{new Date(v.createdAt).toLocaleString()}</div>
              </div>
              <button
                type="button"
                onClick={() => automationManager.restoreVersion(a.id, v.versionNumber)}
                className="rounded-md bg-primary/10 px-2 py-1 text-primary"
              >
                Wiederherstellen
              </button>
            </GlassPanel>
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <GlassButton variant="ghost" onClick={doExport}>
          <Download className="mr-2 h-4 w-4" /> Export
        </GlassButton>
        <GlassButton variant="ghost" onClick={() => automationManager.duplicate(a.id)}>
          <Copy className="mr-2 h-4 w-4" /> Duplizieren
        </GlassButton>
        <GlassButton
          variant="ghost"
          disabled
          title="Rollback für Teil 10 vorbereitet"
        >
          <Undo2 className="mr-2 h-4 w-4" /> Rollback
        </GlassButton>
        <GlassButton
          variant="ghost"
          onClick={() => {
            automationManager.delete(a.id);
            navigate({ to: "/automations" });
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Löschen
        </GlassButton>
      </div>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</div>;
}
