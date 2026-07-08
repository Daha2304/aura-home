import { useEffect, useState } from "react";
import { Clock, Calendar, Wifi, WifiOff, Server, Radar, RefreshCw, Info, User, Zap, Sparkles, CheckCircle2 } from "lucide-react";
import { useSettingsStore } from "@/store/slices/settingsStore";
import { useConnectionStore } from "@/store/slices/connectionStore";
import { useDiscoveryStore } from "@/store/slices/discoveryStore";
import { greetingForTime, systemHeroMessage } from "@/services/runtime/greetings";

/* ============ Kleine Bausteine ============ */

function useTick(intervalMs = 1000) {
  const [, setN] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setN((n) => n + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
}

function TileTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
      {icon}
      {children}
    </div>
  );
}

/* ============ Widgets ============ */

export function ClockWidget() {
  useTick(1000);
  const now = new Date();
  const t = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="flex h-full w-full flex-col justify-between p-4">
      <TileTitle icon={<Clock className="h-3 w-3" />}>Uhrzeit</TileTitle>
      <div className="text-4xl font-semibold tabular-nums tracking-tight">{t}</div>
    </div>
  );
}

export function DateWidget() {
  const d = new Date();
  const day = d.toLocaleDateString("de-DE", { weekday: "long" });
  const date = d.toLocaleDateString("de-DE", { day: "numeric", month: "long" });
  return (
    <div className="flex h-full w-full flex-col justify-between p-4">
      <TileTitle icon={<Calendar className="h-3 w-3" />}>Datum</TileTitle>
      <div>
        <div className="text-xl font-semibold tracking-tight">{day}</div>
        <div className="text-sm text-muted-foreground">{date}</div>
      </div>
    </div>
  );
}

export function DashboardTitleWidget({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <div className="flex h-full w-full flex-col justify-center p-5">
      <div className="text-2xl font-semibold tracking-tight">{title ?? "Dashboard"}</div>
      {subtitle ? <div className="text-sm text-muted-foreground">{subtitle}</div> : null}
    </div>
  );
}

export function DashboardHeaderWidget({ title }: { title?: string }) {
  useTick(60_000);
  const now = new Date();
  const t = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="flex h-full w-full items-center justify-between p-5">
      <div className="min-w-0">
        <div className="truncate text-xl font-semibold tracking-tight">{title ?? "Zuhause"}</div>
        <div className="text-xs text-muted-foreground">{greetingForTime(now)}</div>
      </div>
      <div className="shrink-0 text-3xl font-semibold tabular-nums">{t}</div>
    </div>
  );
}

export function WelcomeWidget() {
  const g = greetingForTime();
  return (
    <div className="flex h-full w-full flex-col justify-center p-6">
      <div className="text-[11px] font-medium uppercase tracking-widest text-primary">Willkommen</div>
      <div className="mt-1 text-3xl font-semibold tracking-tight">{g}</div>
      <div className="mt-2 text-sm text-muted-foreground">Schön, dich zu sehen.</div>
    </div>
  );
}

export function ServerStatusWidget() {
  const active = useSettingsStore((s) => s.activeServer());
  const status = useConnectionStore((s) => s.status);
  const ok = status === "connected";
  return (
    <div className="flex h-full w-full flex-col justify-between p-4">
      <TileTitle icon={<Server className="h-3 w-3" />}>Server</TileTitle>
      <div>
        <div className="truncate text-lg font-semibold tracking-tight">{active?.name ?? "Kein Server"}</div>
        <div className={`text-xs ${ok ? "text-success" : "text-muted-foreground"}`}>
          {ok ? "Verbunden" : status}
        </div>
      </div>
    </div>
  );
}

export function ConnectionStatusWidget() {
  const status = useConnectionStore((s) => s.status);
  const latency = useConnectionStore((s) => s.latencyMs);
  const ok = status === "connected";
  return (
    <div className="flex h-full w-full flex-col justify-between p-4">
      <TileTitle icon={ok ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}>
        Verbindung
      </TileTitle>
      <div>
        <div className={`text-lg font-semibold tracking-tight ${ok ? "text-success" : "text-destructive"}`}>
          {ok ? "Online" : "Offline"}
        </div>
        {latency !== undefined ? (
          <div className="text-xs text-muted-foreground">{latency} ms</div>
        ) : null}
      </div>
    </div>
  );
}

export function DiscoveryStatusWidget() {
  const state = useDiscoveryStore((s) => s.state);
  const devices = useDiscoveryStore((s) => s.stats.devices);
  return (
    <div className="flex h-full w-full flex-col justify-between p-4">
      <TileTitle icon={<Radar className="h-3 w-3" />}>Discovery</TileTitle>
      <div>
        <div className="text-lg font-semibold tracking-tight capitalize">{state}</div>
        <div className="text-xs text-muted-foreground">{devices} Geräte</div>
      </div>
    </div>
  );
}

export function SyncStatusWidget() {
  const last = useDiscoveryStore((s) => s.lastSyncAt);
  const rel = last ? new Date(last).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "—";
  return (
    <div className="flex h-full w-full flex-col justify-between p-4">
      <TileTitle icon={<RefreshCw className="h-3 w-3" />}>Sync</TileTitle>
      <div>
        <div className="text-lg font-semibold tracking-tight">Aktuell</div>
        <div className="text-xs text-muted-foreground">zuletzt {rel}</div>
      </div>
    </div>
  );
}

export function SystemInfoWidget() {
  const servers = useSettingsStore((s) => s.servers.length);
  return (
    <div className="flex h-full w-full flex-col justify-between p-4">
      <TileTitle icon={<Info className="h-3 w-3" />}>System</TileTitle>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-muted-foreground">Server</div>
          <div className="text-sm font-semibold">{servers}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Version</div>
          <div className="text-sm font-semibold">1.0.0</div>
        </div>
      </div>
    </div>
  );
}

export function AppVersionWidget() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Version</div>
      <div className="text-lg font-semibold">1.0.0</div>
    </div>
  );
}

export function UserProfileWidget() {
  return (
    <div className="flex h-full w-full items-center gap-3 p-4">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-primary">
        <User className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">Benutzer</div>
        <div className="truncate text-xs text-muted-foreground">Bereit</div>
      </div>
    </div>
  );
}

export function QuickActionsWidget() {
  return (
    <div className="flex h-full w-full flex-col justify-between p-4">
      <TileTitle icon={<Zap className="h-3 w-3" />}>Aktionen</TileTitle>
      <div className="text-xs text-muted-foreground">Bald verfügbar</div>
    </div>
  );
}

export function HeroGreetingWidget() {
  const g = greetingForTime();
  return (
    <div className="relative flex h-full w-full flex-col justify-end p-6">
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_0%_0%,var(--color-primary)/25,transparent_60%)]" />
      <div className="relative">
        <div className="text-[11px] font-medium uppercase tracking-widest text-primary/80">Hero</div>
        <div className="mt-1 text-4xl font-semibold tracking-tight">{g}</div>
        <div className="mt-2 max-w-md text-sm text-muted-foreground">
          Alles Wichtige auf einen Blick.
        </div>
      </div>
    </div>
  );
}

export function HeroStatusWidget() {
  const status = useConnectionStore((s) => s.status);
  const disc = useDiscoveryStore((s) => s.state);
  const active = useSettingsStore((s) => s.activeServer());
  const hero = systemHeroMessage({
    connected: status === "connected",
    discoveryReady: disc === "ready",
    syncing: disc === "syncing",
    serverName: active?.name,
  });
  const toneIcon =
    hero.tone === "ok" ? <CheckCircle2 className="h-6 w-6 text-success" /> : hero.tone === "warn" ? <WifiOff className="h-6 w-6 text-destructive" /> : <Sparkles className="h-6 w-6 text-info" />;
  return (
    <div className="flex h-full w-full items-center gap-4 p-6">
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-surface-elevated/70">
        {toneIcon}
      </div>
      <div className="min-w-0">
        <div className="truncate text-2xl font-semibold tracking-tight">{hero.title}</div>
        <div className="truncate text-sm text-muted-foreground">{hero.subtitle}</div>
      </div>
    </div>
  );
}
