import { AnimatePresence, motion } from "framer-motion";
import { useRuntimeOverlays } from "@/hooks/runtime/useRuntimeOverlays";
import { Loader2, WifiOff, RefreshCw, ShieldAlert, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import type { RuntimeOverlayId } from "@/services/runtime/RuntimeEvents";
import { GlassSurface } from "../glass/GlassSurface";

const config: Record<
  RuntimeOverlayId,
  { title: string; subtitle: string; icon: ReactNode; tone: string }
> = {
  discovery: {
    title: "Discovery läuft",
    subtitle: "Geräte werden erkannt",
    icon: <Loader2 className="h-5 w-5 animate-spin" />,
    tone: "text-info",
  },
  "server-offline": {
    title: "Server offline",
    subtitle: "Verbindung wird wiederhergestellt",
    icon: <WifiOff className="h-5 w-5" />,
    tone: "text-destructive",
  },
  sync: {
    title: "Synchronisierung läuft",
    subtitle: "Daten werden abgeglichen",
    icon: <RefreshCw className="h-5 w-5 animate-spin" />,
    tone: "text-info",
  },
  auth: {
    title: "Authentifizierung",
    subtitle: "Anmeldung wird geprüft",
    icon: <ShieldAlert className="h-5 w-5" />,
    tone: "text-warning",
  },
  update: {
    title: "Neue Version verfügbar",
    subtitle: "Aktualisierung bereit",
    icon: <Sparkles className="h-5 w-5" />,
    tone: "text-primary",
  },
};

export function OverlayLayer() {
  const overlays = useRuntimeOverlays();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(env(safe-area-inset-top),0.5rem)] z-50 flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {overlays.map((id) => {
          const c = config[id];
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto w-full max-w-sm"
            >
              <GlassSurface variant="frost" radius="lg" className="flex items-center gap-3 px-4 py-3">
                <div className={c.tone}>{c.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{c.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{c.subtitle}</div>
                </div>
              </GlassSurface>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
