import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Info, CheckCircle2, AlertTriangle, AlertOctagon, Siren } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { notificationManager } from "@/services/notifications/NotificationManager";
import { useNotificationPreferencesStore } from "@/store/slices/notificationPreferencesStore";
import type { AppNotification, NotificationAction } from "@/models/notification";
import type { Severity } from "@/models/severity";
import { SEVERITY_ORDER } from "@/models/severity";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const ICONS: Record<Severity, LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertOctagon,
  critical: Siren,
};

const ACCENT: Record<Severity, string> = {
  info: "border-sky-400/30 bg-sky-400/10 text-sky-100",
  success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  warning: "border-amber-400/40 bg-amber-400/10 text-amber-50",
  error: "border-red-500/40 bg-red-500/10 text-red-50",
  critical: "border-red-600/50 bg-red-600/15 text-red-50",
};

const DURATION: Record<string, number> = {
  low: 3500,
  normal: 5000,
  high: 8000,
  urgent: 12000,
};

interface ToastItem {
  notification: AppNotification;
  expiresAt: number;
}

export function ToastHost() {
  const prefs = useNotificationPreferencesStore((s) => s.preferences);
  const [items, setItems] = useState<ToastItem[]>([]);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const off = notificationManager.events.on("toast", ({ notification }) => {
      if (!prefs.toastsEnabled) return;
      if (
        SEVERITY_ORDER[notification.severity] <
        SEVERITY_ORDER[prefs.toastMinSeverity]
      )
        return;
      const dur =
        DURATION[notification.priority ?? "normal"] ?? prefs.toastDefaultDurationMs;
      setItems((prev) =>
        [
          ...prev,
          { notification, expiresAt: Date.now() + dur },
        ].slice(-prefs.toastMaxVisible),
      );
    });
    return off;
  }, [prefs]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      const now = Date.now();
      setItems((prev) => prev.filter((i) => i.expiresAt > now));
    }, 250);
    return () => clearInterval(t);
  }, [paused]);

  function dismiss(id: string) {
    setItems((prev) => prev.filter((i) => i.notification.id !== id));
  }

  function onAction(n: AppNotification, a: NotificationAction) {
    void notificationManager.runAction(n.id, a, (to) =>
      navigate({ to: to as any }),
    );
    dismiss(n.id);
  }

  if (!items.length) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-3 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence initial={false}>
        {items.map(({ notification: n }) => {
          const Icon = ICONS[n.severity] ?? Info;
          const isAlert = n.severity === "error" || n.severity === "critical";
          return (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              role={isAlert ? "alert" : "status"}
              aria-live={isAlert ? "assertive" : "polite"}
              className={cn(
                "pointer-events-auto glass-card hairline w-full max-w-sm overflow-hidden rounded-2xl border p-3 backdrop-blur-xl",
                ACCENT[n.severity],
              )}
            >
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold leading-tight">
                    {n.title}
                  </div>
                  {n.message && (
                    <div className="mt-0.5 truncate text-xs opacity-90">
                      {n.message}
                    </div>
                  )}
                  {n.actions?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {n.actions.slice(0, 3).map((a) => (
                        <button
                          key={a.id}
                          onClick={() => onAction(n, a)}
                          className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium hover:bg-white/20"
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <button
                  aria-label="Schließen"
                  onClick={() => dismiss(n.id)}
                  className="rounded-full p-1 opacity-70 hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
