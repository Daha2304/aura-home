import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Download, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { useLogStore, filterLogs, serializeLogs } from "@/store/slices/logStore";
import type { LogLevel } from "@/services/logger/Logger";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/settings/logs")({
  head: () => ({ meta: [{ title: "Logs · Einstellungen" }] }),
  component: LogsPage,
});

const LEVELS: Array<Exclude<LogLevel, "silent">> = [
  "critical",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
];

const LEVEL_COLOR: Record<string, string> = {
  critical: "text-red-500",
  error: "text-red-400",
  warn: "text-amber-300",
  info: "text-sky-300",
  debug: "text-muted-foreground",
  trace: "text-muted-foreground",
};

function LogsPage() {
  const entries = useLogStore((s) => s.entries);
  const clear = useLogStore((s) => s.clear);
  const [enabled, setEnabled] = useState<Set<Exclude<LogLevel, "silent">>>(
    new Set(LEVELS),
  );
  const [scope, setScope] = useState("");

  const filtered = useMemo(
    () => filterLogs(entries, { levels: enabled, scope: scope || undefined }),
    [entries, enabled, scope],
  );

  const toggleLevel = (lvl: Exclude<LogLevel, "silent">) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(lvl)) next.delete(lvl);
      else next.add(lvl);
      return next;
    });
  };

  const exportLogs = () => {
    const blob = new Blob([serializeLogs(filtered)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Link to="/settings" className="mb-2 inline-flex items-center gap-1 text-sm text-accent">
        <ChevronLeft className="h-4 w-4" /> Einstellungen
      </Link>
      <PageHeader title="Logs" />

      <GlassPanel className="mb-3">
        <div className="flex flex-wrap items-center gap-2">
          {LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => toggleLevel(lvl)}
              aria-pressed={enabled.has(lvl)}
              className={cn(
                "rounded-full border px-2 py-1 text-[11px] uppercase tracking-wide",
                enabled.has(lvl)
                  ? "border-accent/40 bg-accent/15 text-accent"
                  : "border-white/10 text-muted-foreground",
              )}
            >
              {lvl}
            </button>
          ))}
          <input
            aria-label="Scope-Filter"
            placeholder="Scope filtern…"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="ml-auto min-w-40 rounded-md border border-white/10 bg-black/30 px-2 py-1 text-xs"
          />
          <button
            onClick={exportLogs}
            aria-label="Logs exportieren"
            className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs hover:bg-white/5"
          >
            <Download className="h-3 w-3" /> Export
          </button>
          <button
            onClick={clear}
            aria-label="Logs löschen"
            className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs hover:bg-white/5"
          >
            <Trash2 className="h-3 w-3" /> Leeren
          </button>
        </div>
      </GlassPanel>

      <GlassPanel>
        <div className="max-h-[70vh] overflow-auto rounded-md bg-black/30 p-2 font-mono text-[11px] leading-relaxed">
          {filtered.length === 0 ? (
            <div className="p-2 text-muted-foreground">Keine Einträge.</div>
          ) : (
            filtered
              .slice(-500)
              .reverse()
              .map((e) => (
                <div
                  key={e.id}
                  className="border-b border-white/5 py-1 last:border-b-0"
                >
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-muted-foreground">
                      {new Date(e.ts).toLocaleTimeString()}
                    </span>
                    <span
                      className={cn(
                        "w-16 shrink-0 font-semibold uppercase",
                        LEVEL_COLOR[e.level],
                      )}
                    >
                      {e.level}
                    </span>
                    <span className="text-accent">[{e.scope}]</span>
                    <span className="break-words">{e.message}</span>
                  </div>
                </div>
              ))
          )}
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          {filtered.length} von {entries.length} Einträgen
        </div>
      </GlassPanel>
    </>
  );
}
