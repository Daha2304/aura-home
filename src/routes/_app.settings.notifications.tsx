import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { Switch } from "@/components/ui/switch";
import { useSettingsStore } from "@/store/slices/settingsStore";

export const Route = createFileRoute("/_app/settings/notifications")({
  component: NotificationsSettings,
});

function NotificationsSettings() {
  const notifications = useSettingsStore((s) => s.notifications);
  const set = useSettingsStore((s) => s.setNotifications);

  const rows: {
    key: keyof typeof notifications;
    label: string;
    hint: string;
  }[] = [
    { key: "enabled", label: "Benachrichtigungen", hint: "Push aktivieren" },
    { key: "deviceOffline", label: "Gerät offline", hint: "Meldung bei Verbindungsverlust" },
    { key: "automationTriggered", label: "Automation ausgeführt", hint: "Bei jedem Auslöser" },
    { key: "securityAlerts", label: "Sicherheit", hint: "Alarm, Rauch, Wasser" },
  ];

  return (
    <>
      <Link to="/settings" className="mb-2 inline-flex items-center gap-1 text-sm text-accent">
        <ChevronLeft className="h-4 w-4" /> Einstellungen
      </Link>
      <PageHeader title="Benachrichtigungen" />
      <GlassPanel>
        <div className="divide-y divide-white/10">
          {rows.map((r) => (
            <label
              key={r.key}
              className="flex items-center justify-between py-3 text-sm"
            >
              <div>
                <div className="font-medium">{r.label}</div>
                <div className="text-xs text-muted-foreground">{r.hint}</div>
              </div>
              <Switch
                checked={notifications[r.key]}
                onCheckedChange={(v) => set({ [r.key]: v })}
              />
            </label>
          ))}
        </div>
      </GlassPanel>
    </>
  );
}
