import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { useUiStore, type Language } from "@/store/slices/uiStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/settings/language")({
  component: LanguageSettings,
});

const options: { value: Language; label: string }[] = [
  { value: "de", label: "Deutsch" },
  { value: "en", label: "English" },
];

function LanguageSettings() {
  const language = useUiStore((s) => s.language);
  const setLanguage = useUiStore((s) => s.setLanguage);
  return (
    <>
      <Link to="/settings" className="mb-2 inline-flex items-center gap-1 text-sm text-accent">
        <ChevronLeft className="h-4 w-4" /> Einstellungen
      </Link>
      <PageHeader title="Sprache" />
      <GlassPanel>
        <div className="divide-y divide-white/10">
          {options.map((o) => {
            const active = language === o.value;
            return (
              <button
                key={o.value}
                onClick={() => setLanguage(o.value)}
                className="flex w-full items-center justify-between py-3 text-left text-sm"
              >
                <span className="font-medium">{o.label}</span>
                <span
                  className={cn(
                    "text-xs",
                    active ? "text-accent" : "text-muted-foreground",
                  )}
                >
                  {active ? "Aktiv" : ""}
                </span>
              </button>
            );
          })}
        </div>
      </GlassPanel>
    </>
  );
}
