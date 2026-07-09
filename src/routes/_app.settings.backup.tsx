import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Download, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { GlassButton } from "@/components/glass/GlassButton";
import {
  backupManager,
  backupProviderRegistry,
  type RestoreMode,
} from "@/services/backup";

export const Route = createFileRoute("/_app/settings/backup")({
  head: () => ({ meta: [{ title: "Backup · Einstellungen" }] }),
  component: BackupSettings,
});

function BackupSettings() {
  const providers = useMemo(() => backupProviderRegistry.list(), []);
  const [selection, setSelection] = useState<Set<string>>(
    () => new Set(providers.map((p) => p.id)),
  );
  const [mode, setMode] = useState<RestoreMode>("merge");
  const [status, setStatus] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function toggle(id: string): void {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onExport(): Promise<void> {
    setStatus(null);
    const env = await backupManager.exportAll({ include: Array.from(selection) });
    backupManager.download(env);
    setStatus(`Export erstellt · ${Object.keys(env.sections).length} Bereiche`);
  }

  async function onImportFile(file: File): Promise<void> {
    try {
      const env = backupManager.parseJSON(await file.text());
      const r = await backupManager.importAll(env, { mode, include: Array.from(selection) });
      setStatus(
        `Import fertig · ok: ${r.imported.length}, übersprungen: ${r.skipped.length}, fehler: ${r.failed.length}`,
      );
    } catch (err) {
      setStatus(`Fehler: ${(err as Error).message}`);
    }
  }

  return (
    <>
      <Link to="/settings" className="mb-2 inline-flex items-center gap-1 text-sm text-accent">
        <ChevronLeft className="h-4 w-4" /> Einstellungen
      </Link>
      <PageHeader title="Backup & Restore" subtitle="Konfiguration sichern und wiederherstellen" />

      <GlassPanel className="space-y-3">
        <div>
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
          <div className="mt-2 flex gap-2 text-xs">
            <button
              onClick={() => setSelection(new Set(providers.map((p) => p.id)))}
              className="text-accent"
            >
              Alle
            </button>
            <button onClick={() => setSelection(new Set())} className="text-muted-foreground">
              Keine
            </button>
          </div>
        </div>

        <div className="border-t border-white/10 pt-3">
          <div className="text-sm font-semibold">Export</div>
          <div className="mb-3 text-xs text-muted-foreground">
            Lädt eine JSON-Datei mit den ausgewählten Bereichen herunter.
          </div>
          <GlassButton variant="primary" size="md" onClick={() => void onExport()}>
            <Download className="h-4 w-4" /> Backup exportieren
          </GlassButton>
        </div>

        <div className="border-t border-white/10 pt-3">
          <div className="text-sm font-semibold">Import</div>
          <div className="mb-2 text-xs text-muted-foreground">
            Wählt eine zuvor exportierte JSON-Datei. Modus:{" "}
            <button
              className="text-accent"
              onClick={() => setMode(mode === "merge" ? "replace" : "merge")}
            >
              {mode === "merge" ? "Zusammenführen" : "Ersetzen"}
            </button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImportFile(f);
            }}
          />
          <GlassButton variant="ghost" size="md" onClick={() => inputRef.current?.click()}>
            <Upload className="h-4 w-4" /> Backup importieren
          </GlassButton>
        </div>

        {status ? (
          <div className="border-t border-white/10 pt-3 text-xs text-muted-foreground" aria-live="polite">
            {status}
          </div>
        ) : null}
      </GlassPanel>
    </>
  );
}
