import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/glass/GlassCard";
import { EmptyState } from "@/components/common/EmptyState";
import { useTimelineStore } from "@/store/slices/timelineStore";
import { severityRegistry } from "@/services/timeline/SeverityRegistry";
import { eventCategoryRegistry } from "@/services/timeline/EventCategoryRegistry";
import { SEVERITIES, type Severity } from "@/models/severity";
import type { TimelineSourceKind } from "@/models/timeline";

export const Route = createFileRoute("/_app/timeline")({
  head: () => ({ meta: [{ title: "Timeline · Smart Home" }] }),
  component: TimelinePage,
});

const SOURCES: TimelineSourceKind[] = [
  "automation", "scene", "device", "group", "system", "notification", "user",
];

function TimelinePage() {
  const [source, setSource] = useState<TimelineSourceKind | "all">("all");
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const [search, setSearch] = useState("");
  const entries = useTimelineStore((s) => s.entries);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (source !== "all" && e.source !== source) return false;
      if (severity !== "all" && e.severity !== severity) return false;
      if (q) {
        const hay = `${e.title ?? ""} ${e.detail ?? ""} ${e.kind}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [entries, source, severity, search]);

  return (
    <>
      <PageHeader title="Timeline" subtitle="Zentrale Ereignis-Historie" />
      <GlassCard className="mb-3 space-y-2 p-3">
        <input
          type="search"
          placeholder="Suchen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm outline-none"
          aria-label="Timeline durchsuchen"
        />
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Quelle">
          <Chip active={source === "all"} onClick={() => setSource("all")}>Alle Quellen</Chip>
          {SOURCES.map((s) => (
            <Chip key={s} active={source === s} onClick={() => setSource(s)}>
              {s}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Severity">
          <Chip active={severity === "all"} onClick={() => setSeverity("all")}>Alle</Chip>
          {SEVERITIES.map((s) => (
            <Chip key={s} active={severity === s} onClick={() => setSeverity(s)}>
              {severityRegistry.get(s).label}
            </Chip>
          ))}
        </div>
      </GlassCard>

      {filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title="Keine Ereignisse"
          description="Sobald etwas passiert, erscheint es hier."
        />
      ) : (
        <ul className="space-y-1.5" aria-live="polite">
          {filtered.slice(0, 300).map((e) => {
            const sev = severityRegistry.get(e.severity ?? "info");
            const cat = e.category ? eventCategoryRegistry.get(e.category) : null;
            return (
              <li key={e.id}>
                <GlassCard className="flex items-start gap-3 p-3">
                  <div
                    className="mt-1 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: sevColor(e.severity) }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="truncate">{e.title ?? e.kind}</span>
                    </div>
                    {e.detail && (
                      <div className="truncate text-xs text-muted-foreground">{e.detail}</div>
                    )}
                    <div className="mt-1 flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                      <span>{new Date(e.timestamp).toLocaleTimeString()}</span>
                      <span>·</span>
                      <span>{e.source}</span>
                      {cat && <><span>·</span><span>{cat.label}</span></>}
                      <span>·</span>
                      <span>{sev.label}</span>
                    </div>
                  </div>
                </GlassCard>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function sevColor(s?: Severity): string {
  switch (s) {
    case "success": return "rgb(52 211 153)";
    case "warning": return "rgb(251 191 36)";
    case "error":
    case "critical": return "rgb(239 68 68)";
    default: return "rgb(56 189 248)";
  }
}

function Chip({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs transition ${
        active ? "bg-accent text-accent-foreground" : "bg-white/5 text-muted-foreground hover:bg-white/10"
      }`}
      role="tab"
      aria-selected={active}
    >
      {children}
    </button>
  );
}
