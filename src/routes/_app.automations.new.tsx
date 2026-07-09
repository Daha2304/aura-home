import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles, Workflow } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/glass/GlassCard";
import { EmptyState } from "@/components/common/EmptyState";
import { automationManager, automationTemplateManager } from "@/services/automations";
import { useAutomationTemplatesStore } from "@/store/slices/automationTemplatesStore";

export const Route = createFileRoute("/_app/automations/new")({
  head: () => ({ meta: [{ title: "Neue Automation" }] }),
  component: NewAutomationPage,
});

function NewAutomationPage() {
  const navigate = useNavigate();
  const templates = useAutomationTemplatesStore((s) => s.templates);

  const createEmpty = () => {
    const a = automationManager.create({ name: "Neue Automation" });
    navigate({ to: "/automations/$automationId/edit", params: { automationId: a.id } });
  };
  const createFromTemplate = (templateId: string) => {
    const a = automationTemplateManager.instantiate(templateId);
    if (!a) return;
    navigate({ to: "/automations/$automationId/edit", params: { automationId: a.id } });
  };

  return (
    <>
      <PageHeader title="Neue Automation" />

      <GlassCard interactive onClick={createEmpty} className="mb-3 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Workflow className="h-5 w-5" />
        </div>
        <div>
          <div className="text-[15px] font-semibold">Leere Automation</div>
          <div className="text-xs text-muted-foreground">Von Grund auf konfigurieren</div>
        </div>
      </GlassCard>

      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Templates</div>
      {templates.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Keine Templates"
          description="Templates können importiert oder programmatisch registriert werden."
        />
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <GlassCard key={t.id} interactive onClick={() => createFromTemplate(t.id)} className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-accent/15 text-accent">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-semibold">{t.name}</div>
                <div className="truncate text-xs text-muted-foreground">{t.description}</div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </>
  );
}
