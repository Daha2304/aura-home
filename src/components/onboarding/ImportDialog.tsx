import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload } from "lucide-react";
import { GlassButton } from "@/components/glass/GlassButton";
import { parseServersImport } from "@/services/onboarding/serverImportExport";
import type { ServerConfig } from "@/models/server";

interface ImportDialogProps {
  open: boolean;
  onCancel: () => void;
  onImport: (servers: ServerConfig[], mode: "merge" | "replace") => void;
}

export function ImportDialog({ open, onCancel, onImport }: ImportDialogProps) {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ServerConfig[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const tryParse = (raw: string) => {
    setText(raw);
    setError(null);
    if (!raw.trim()) {
      setParsed(null);
      return;
    }
    try {
      setParsed(parseServersImport(raw));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ungültige Datei");
      setParsed(null);
    }
  };

  const onFile = async (f?: File | null) => {
    if (!f) return;
    tryParse(await f.text());
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-[max(env(safe-area-inset-bottom),1rem)] backdrop-blur-md sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            role="dialog"
            aria-labelledby="import-title"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="glass-card w-full max-w-md p-6"
          >
            <h2 id="import-title" className="text-lg font-semibold">
              Konfiguration importieren
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Wähle eine Backup-Datei oder füge JSON direkt ein.
            </p>
            <div className="mt-4 flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
              <GlassButton
                variant="ghost"
                size="md"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-4 w-4" /> Datei wählen
              </GlassButton>
            </div>
            <textarea
              value={text}
              onChange={(e) => tryParse(e.target.value)}
              placeholder="{ &quot;version&quot;: 1, &quot;servers&quot;: [...] }"
              className="mt-3 h-32 w-full rounded-xl border border-white/10 bg-white/5 p-3 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            />
            {error && (
              <div className="mt-2 text-xs text-destructive">{error}</div>
            )}
            {parsed && (
              <div className="mt-2 text-xs text-muted-foreground">
                {parsed.length} Server erkannt
              </div>
            )}
            <div className="mt-5 flex flex-col gap-2">
              <GlassButton
                variant="primary"
                size="lg"
                disabled={!parsed}
                onClick={() => parsed && onImport(parsed, "merge")}
              >
                Zusammenführen
              </GlassButton>
              <GlassButton
                variant="ghost"
                size="md"
                disabled={!parsed}
                onClick={() => parsed && onImport(parsed, "replace")}
              >
                Vorhandene ersetzen
              </GlassButton>
              <GlassButton variant="ghost" size="md" onClick={onCancel}>
                Abbrechen
              </GlassButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
