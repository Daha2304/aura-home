import { motion, AnimatePresence } from "framer-motion";
import { AlertOctagon } from "lucide-react";
import { GlassButton } from "@/components/glass/GlassButton";
import type { AppErrorPayload } from "@/services/errors/AppError";

interface ErrorDialogProps {
  open: boolean;
  error?: AppErrorPayload | null;
  onRetry?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
}

const HINTS: Record<string, string> = {
  NETWORK_UNREACHABLE:
    "Host, Port und Netzwerkverbindung prüfen. Ist der Server erreichbar?",
  TIMEOUT: "Der Server antwortet nicht. Verbindung, SSL und Port prüfen.",
  AUTH_FAILED: "Zugangsdaten prüfen. Passwort, Token oder Benutzername.",
  WS_ERROR: "Der Server hat einen unerwarteten Fehler gemeldet.",
  connect_timeout: "Server nicht erreichbar. Adresse und Port prüfen.",
  auth_timeout: "Server hat die Authentifizierung nicht beantwortet.",
  discovery_timeout: "Discovery wurde vom Server nicht gestartet.",
  sync_timeout: "Synchronisation wurde nicht abgeschlossen.",
};

export function ErrorDialog({
  open,
  error,
  onRetry,
  onEdit,
  onCancel,
}: ErrorDialogProps) {
  return (
    <AnimatePresence>
      {open && error && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-[max(env(safe-area-inset-bottom),1rem)] backdrop-blur-md sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          role="presentation"
        >
          <motion.div
            role="alertdialog"
            aria-labelledby="error-title"
            aria-describedby="error-desc"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="glass-card w-full max-w-sm p-6"
          >
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-destructive/15 text-destructive">
              <AlertOctagon className="h-6 w-6" />
            </div>
            <h2 id="error-title" className="text-lg font-semibold">
              Verbindung fehlgeschlagen
            </h2>
            <p id="error-desc" className="mt-1 text-sm text-muted-foreground">
              {error.message}
            </p>
            {error.code && HINTS[error.code] && (
              <p className="mt-3 text-sm">{HINTS[error.code]}</p>
            )}
            {error.code && (
              <p className="mt-4 rounded-xl bg-white/5 px-3 py-2 font-mono text-[11px] text-muted-foreground">
                {error.kind} · {error.code}
              </p>
            )}
            <div className="mt-6 flex flex-col gap-2">
              {onRetry && (
                <GlassButton variant="primary" size="lg" onClick={onRetry}>
                  Erneut versuchen
                </GlassButton>
              )}
              {onEdit && (
                <GlassButton variant="ghost" size="md" onClick={onEdit}>
                  Bearbeiten
                </GlassButton>
              )}
              {onCancel && (
                <GlassButton variant="ghost" size="md" onClick={onCancel}>
                  Abbrechen
                </GlassButton>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
