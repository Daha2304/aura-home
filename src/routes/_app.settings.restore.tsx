import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { GlassButton } from "@/components/glass/GlassButton";
import {
  backupManager,
  backupProviderRegistry,
  type RestoreMode,
} from "@/services/backup";

export const Route = createFileRoute("/_app/settings/restore")({
  head: () => ({ meta: [{ title: "Restore · Einstellungen" }] }),
  component: RestoreSettings,
});

function RestoreSettings() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<RestoreMode>("merge");
  const [selection, setSelection] = useState<Set<string>>(() =>
    new Set(backupProviderRegistry.list().map((p) => p.id)),
  );
  const [status, setStatus] = useState<string | null>(null);

  const providers = backupProviderRegistry.list();

  function toggle(id: string): void {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onFile(file: File): Promise<void> {
    try {
      const text = await file.text();
      const env = backupManager.parseJSON(text);
      const result = await backupManager.importAll(env, {
        mode,
        include: Array.from(selection),
      });
      setStatus(
        `Restore abgeschlossen · Übernommen: ${result.imported.length}, ` +
          `Übersprungen: ${result.skipped.length}, Fehler: ${result.failed.length}`,
      );
    } catch (err) {
      setStatus(`Fehler beim Restore: ${(err as Error).message}`);
    }
  }

  return (
    <>
      <Link to="/settings" className="mb-2 inline-flex items-center gap-1 text-sm text-accent">
        <ChevronLeft className="h-4 w-4" /> Einstellungen
      </Link>
      <PageHeader title="Restore" subtitle="Backup wiederherstellen" />

      <GlassPanel className="space-y-3">
        <div>
          <div className="mb-2 text-sm font-semibold">Modus</div>
          <div className="flex gap-2">
            {(["merge", "replace"] as RestoreMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-full px-4 py-2 text-sm ${
                  mode === m ? "bg-accent text-accent-foreground" : "bg-white/5"
                }`}
                aria-pressed={mode === m}
              >
                {m === "merge" ? "Zusammenführen" : "Ersetzen"}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Zusammenführen: bestehende Daten bleiben, importierte werden ergänzt.
            Ersetzen: bestehende Daten werden überschrieben.
          </p>
        </div>

        <div className="border-t border-white/10 pt-3">
          <div className="mb-2 text-sm font-semibold">Bereiche</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {providers.map((p) => (
              <label
                key={p.id}
                className="flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 text-xs"
              >
                <input
                  type="checkbox"
                  checked={selection.has(p.id)}
                  onChange={() => toggle(p.id)}
                  className="accent-accent"
                />
                <span className="truncate">{p.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 pt-3">
          <input
            ref={inputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
          <GlassButton variant="primary" size="md" onClick={() => inputRef.current?.click()}>
            <Upload className="h-4 w-4" /> Backup auswählen
          </GlassButton>
          {status ? (
            <div className="mt-3 text-xs text-muted-foreground" aria-live="polite">
              {status}
            </div>
          ) : null}
        </div>
      </GlassPanel>
    </>
  );
}
