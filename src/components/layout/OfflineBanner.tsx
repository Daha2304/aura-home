import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, RefreshCw, Settings2, Terminal } from "lucide-react";
import { useConnectionStore } from "@/store/slices/connectionStore";
import { useSettingsStore } from "@/store/slices/settingsStore";
import { useWebSocketActions } from "@/hooks/useWebSocketStatus";
import { useHydrated } from "@/hooks/useHydrated";
import { cn } from "@/lib/utils";

/**
 * Zeigt einen dezenten, hochwertigen Banner an, wenn der aktive Server
 * gerade nicht verbunden oder nicht authentifiziert ist. Blockiert niemals
 * die Navigation — bietet lediglich Aktionen an.
 */
export function OfflineBanner() {
  const hydrated = useHydrated();
  const status = useConnectionStore((s) => s.status);
  const authenticated = useConnectionStore((s) => s.authenticated);
  const lastError = useConnectionStore((s) => s.lastError);
  const activeServer = useSettingsStore((s) => s.activeServer());
  const { reconnect } = useWebSocketActions();

  if (!hydrated) return null;
  if (!activeServer) return null;

  const connected = status === "connected" && authenticated;
  const connecting = status === "connecting" || status === "reconnecting";

  // Wenn alles gut ist, keinen Banner rendern.
  if (connected) return null;

  const label =
    status === "connected" && !authenticated
      ? "Anmeldung fehlgeschlagen"
      : connecting
        ? "Verbindung wird aufgebaut …"
        : status === "error"
          ? "Verbindungsfehler"
          : "Server nicht verbunden";

  return (
    <AnimatePresence>
      <motion.div
        key="offline-banner"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        role="status"
        aria-live="polite"
        className="mb-3"
      >
        <div className="glass-card flex flex-col gap-3 p-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                connecting
                  ? "bg-info/15 text-info"
                  : "bg-destructive/15 text-destructive",
              )}
            >
              {connecting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <WifiOff className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold">{label}</div>
              <div className="truncate text-xs text-muted-foreground">
                {activeServer.name} · {activeServer.host}:{activeServer.port}
                {lastError ? ` · ${lastError}` : ""}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => reconnect()}
              disabled={connecting}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-medium text-primary-foreground shadow-md shadow-primary/25 disabled:opacity-60"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Erneut verbinden
            </button>
            <Link
              to="/settings/server/$id"
              params={{ id: activeServer.id }}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background/40 px-3 text-xs font-medium hover:bg-background/60"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Server bearbeiten
            </Link>
            <Link
              to="/settings/developer"
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background/40 px-3 text-xs font-medium hover:bg-background/60"
            >
              <Terminal className="h-3.5 w-3.5" />
              Logs & Debug
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
