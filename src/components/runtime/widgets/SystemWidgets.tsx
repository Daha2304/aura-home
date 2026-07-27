import { useEffect, useState } from "react";
import {
  BatteryWarning,
  Clock,
  Calendar,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Wifi,
  WifiOff,
  Server,
  Radar,
  RefreshCw,
  Info,
  User,
  Zap,
  Sparkles,
  CheckCircle2,
  DoorOpen,
  MapPin,
  Sun,
} from "lucide-react";
import { useSettingsStore } from "@/store/slices/settingsStore";
import { useConnectionStore } from "@/store/slices/connectionStore";
import { useDiscoveryStore } from "@/store/slices/discoveryStore";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { useRoomsStore } from "@/store/slices/roomsStore";
import { greetingForTime, systemHeroMessage } from "@/services/runtime/greetings";
import {
  fetchDwdWeather,
  type DwdWeatherSnapshot,
  type WeatherCondition,
} from "@/services/weather/dwdWeather";
import { Input } from "@/components/ui/input";
import { GlassButton } from "@/components/glass/GlassButton";
import type { Device } from "@/models/device";

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
    <div className="grid h-full w-full grid-rows-[auto_1fr] p-4">
      <TileTitle icon={<Clock className="h-3 w-3" />}>Uhrzeit</TileTitle>
      <div className="flex items-center justify-center text-center text-3xl font-semibold tabular-nums tracking-tight">
        {t}
      </div>
    </div>
  );
}

export function DateWidget() {
  const d = new Date();
  const day = d.toLocaleDateString("de-DE", { weekday: "long" });
  const date = d.toLocaleDateString("de-DE", { day: "numeric", month: "long" });
  return (
    <div className="grid h-full w-full grid-rows-[auto_1fr] p-4">
      <TileTitle icon={<Calendar className="h-3 w-3" />}>Datum</TileTitle>
      <div className="flex flex-col items-center justify-center text-center">
        <div className="text-lg font-semibold tracking-tight">{day}</div>
        <div className="text-xs text-muted-foreground">{date}</div>
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
      <div className="text-[11px] font-medium uppercase tracking-widest text-primary">
        Willkommen
      </div>
      <div className="mt-1 text-3xl font-semibold tracking-tight">{g}</div>
      <div className="mt-2 text-sm text-muted-foreground">Schön, dich zu sehen.</div>
    </div>
  );
}

export function ServerStatusWidget() {
  const active = useSettingsStore((s) => s.activeServer());
  const status = useConnectionStore((s) => s.status);
  const ok = status === "connected" || status === "authenticated";
  return (
    <div className="flex h-full w-full flex-col justify-between p-4">
      <TileTitle icon={<Server className="h-3 w-3" />}>Server</TileTitle>
      <div>
        <div className="truncate text-lg font-semibold tracking-tight">
          {active?.name ?? "Kein Server"}
        </div>
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
  const ok = status === "connected" || status === "authenticated";
  return (
    <div className="flex h-full w-full flex-col justify-between p-4">
      <TileTitle icon={ok ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}>
        Verbindung
      </TileTitle>
      <div>
        <div
          className={`text-lg font-semibold tracking-tight ${ok ? "text-success" : "text-destructive"}`}
        >
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
  const rel = last
    ? new Date(last).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
    : "—";
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

export function SystemStatusSummaryWidget() {
  const active = useSettingsStore((s) => s.activeServer());
  const status = useConnectionStore((s) => s.status);
  const latency = useConnectionStore((s) => s.latencyMs);
  const last = useDiscoveryStore((s) => s.lastSyncAt);
  const ok = status === "connected" || status === "authenticated";
  const lastSync = last
    ? new Date(last).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
    : "–";

  return (
    <div className="grid h-full w-full grid-rows-[auto_1fr] p-4">
      <TileTitle icon={<Server className="h-3 w-3" />}>Systemstatus</TileTitle>
      <div className="grid grid-cols-2 content-center gap-x-5 gap-y-4">
        <StatusMetric
          icon={<Server className="h-4 w-4" />}
          label="Server"
          value={active?.name ?? "Kein Server"}
          detail={ok ? "Verbunden" : status}
          tone={ok ? "success" : "neutral"}
        />
        <StatusMetric
          icon={ok ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          label="Verbindung"
          value={ok ? "Online" : "Offline"}
          detail={latency !== undefined ? `${latency} ms` : "–"}
          tone={ok ? "success" : "danger"}
        />
        <StatusMetric
          icon={<RefreshCw className="h-4 w-4" />}
          label="Sync"
          value="Aktuell"
          detail={`zuletzt ${lastSync}`}
          tone="neutral"
        />
        <StatusMetric
          icon={<Info className="h-4 w-4" />}
          label="Version"
          value="1.0.0"
          detail="Aura Home"
          tone="neutral"
        />
      </div>
    </div>
  );
}

export function OpeningsAlertWidget() {
  const devices = useDevicesStore((s) => s.devices);
  const rooms = useRoomsStore((s) => s.byId);
  const open = devices.filter(isOpenOpeningDevice).slice(0, 4);

  return (
    <div className="grid h-full w-full grid-rows-[auto_1fr] p-4">
      <TileTitle icon={<DoorOpen className="h-3 w-3" />}>Fenster & Türen</TileTitle>
      {open.length === 0 ? (
        <WidgetOkState title="Alles geschlossen" detail="Keine offenen Kontakte" />
      ) : (
        <div className="flex flex-col justify-center gap-2 overflow-hidden">
          <div className="text-lg font-semibold tracking-tight text-warning">
            {open.length} offen
          </div>
          <div className="space-y-1 overflow-hidden">
            {open.map((device) => (
              <CompactDeviceLine
                key={device.id}
                name={device.name}
                detail={device.roomId ? rooms[device.roomId]?.name : undefined}
                value="Offen"
                tone="warning"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function LowBatteryWidget() {
  const devices = useDevicesStore((s) => s.devices);
  const rooms = useRoomsStore((s) => s.byId);
  const low = devices
    .map((device) => ({ device, battery: readBatteryLevel(device) }))
    .filter(
      (entry): entry is { device: Device; battery: number } => typeof entry.battery === "number",
    )
    .filter((entry) => entry.battery <= 20)
    .sort((a, b) => a.battery - b.battery)
    .slice(0, 4);

  return (
    <div className="grid h-full w-full grid-rows-[auto_1fr] p-4">
      <TileTitle icon={<BatteryWarning className="h-3 w-3" />}>Batterien</TileTitle>
      {low.length === 0 ? (
        <WidgetOkState title="Batterien ok" detail="Keine niedrigen Werte" />
      ) : (
        <div className="flex flex-col justify-center gap-2 overflow-hidden">
          <div className="text-lg font-semibold tracking-tight text-warning">
            {low.length} niedrig
          </div>
          <div className="space-y-1 overflow-hidden">
            {low.map(({ device, battery }) => (
              <CompactDeviceLine
                key={device.id}
                name={device.name}
                detail={device.roomId ? rooms[device.roomId]?.name : undefined}
                value={`${Math.round(battery)} %`}
                tone="warning"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WidgetOkState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <CheckCircle2 className="mb-2 h-7 w-7 text-success" />
      <div className="text-lg font-semibold tracking-tight">{title}</div>
      <div className="text-xs text-muted-foreground">{detail}</div>
    </div>
  );
}

function CompactDeviceLine({
  name,
  detail,
  value,
  tone,
}: {
  name: string;
  detail?: string;
  value: string;
  tone: "warning" | "neutral";
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2 text-xs">
      <div className="min-w-0">
        <div className="truncate font-medium">{name}</div>
        {detail ? <div className="truncate text-[11px] text-muted-foreground">{detail}</div> : null}
      </div>
      <div className={tone === "warning" ? "shrink-0 font-medium text-warning" : "shrink-0"}>
        {value}
      </div>
    </div>
  );
}

function isOpenOpeningDevice(device: Device): boolean {
  if (!isOpeningDevice(device)) return false;

  const values = [
    ...device.capabilities.map((capability) =>
      "value" in capability ? capability.value : undefined,
    ),
    ...(device.functions ?? []).map((fn) => fn.value),
  ];

  return values.some(
    (value) => value === true || value === "true" || value === "open" || value === "opened",
  );
}

function isOpeningDevice(device: Device): boolean {
  const type = device.type.toLowerCase();
  if (["door", "window", "doorcontact", "windowcontact"].includes(type)) return true;

  return [...device.capabilities, ...(device.functions ?? [])].some((entry) => {
    const id = entry.id.toLowerCase();
    const label = ("label" in entry && entry.label ? entry.label : "").toLowerCase();
    const role =
      typeof ("meta" in entry ? entry.meta?.role : undefined) === "string"
        ? String("meta" in entry ? entry.meta?.role : "").toLowerCase()
        : "";

    return (
      role.includes("window") ||
      role.includes("door") ||
      id.includes("window") ||
      id.includes("fenster") ||
      id.includes("door") ||
      id.includes("tuer") ||
      id.includes("tür") ||
      label.includes("fenster") ||
      label.includes("tür") ||
      label.includes("door")
    );
  });
}

function readBatteryLevel(device: Device): number | undefined {
  if (typeof device.battery === "number") return device.battery;
  const battery = device.functions?.find(
    (fn) => fn.kind === "battery" && typeof fn.value === "number",
  );
  return typeof battery?.value === "number" ? battery.value : undefined;
}

function StatusMetric({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: "success" | "danger" | "neutral";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "danger"
        ? "text-destructive"
        : "text-foreground";

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`mt-1 truncate text-lg font-semibold tracking-tight ${toneClass}`}>
        {value}
      </div>
      <div className="truncate text-xs text-muted-foreground">{detail}</div>
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
  const [postalCode, setPostalCode] = useState(() => readWeatherPostalCode());
  const [draftPostalCode, setDraftPostalCode] = useState(postalCode || "81243");
  const [weather, setWeather] = useState<DwdWeatherSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!postalCode) return;
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const snapshot = await fetchDwdWeather(postalCode);
        if (active) setWeather(snapshot);
      } catch {
        if (active) setError("Wetterdaten nicht erreichbar");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    const interval = window.setInterval(load, 15 * 60_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [postalCode]);

  const savePostalCode = () => {
    const normalized = draftPostalCode.replace(/\D/g, "").slice(0, 5);
    if (normalized.length !== 5) return;
    window.localStorage.setItem(WEATHER_POSTAL_CODE_KEY, normalized);
    setPostalCode(normalized);
  };

  if (!postalCode) {
    return (
      <div className="relative flex h-full w-full overflow-hidden p-6">
        <WeatherBackdrop condition="cloudy" />
        <div className="relative z-10 flex w-full max-w-md flex-col justify-end">
          <div className="text-[11px] font-medium uppercase tracking-widest text-white/75">
            Wetter einrichten
          </div>
          <div className="mt-1 text-3xl font-semibold tracking-tight text-white">{g}</div>
          <div className="mt-2 text-sm text-white/75">
            Gib deine Postleitzahl ein, damit das Dashboard das lokale Wetter anzeigen kann.
          </div>
          <div className="mt-4 flex gap-2">
            <Input
              inputMode="numeric"
              value={draftPostalCode}
              maxLength={5}
              className="border-white/20 bg-white/15 text-white placeholder:text-white/50"
              placeholder="81243"
              onChange={(event) => setDraftPostalCode(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") savePostalCode();
              }}
            />
            <GlassButton variant="primary" onClick={savePostalCode}>
              Speichern
            </GlassButton>
          </div>
        </div>
      </div>
    );
  }

  const condition = weather?.condition ?? "cloudy";
  const WeatherIcon = weatherIcon(condition);

  return (
    <div className="relative flex h-full w-full overflow-hidden p-6 text-white">
      <WeatherBackdrop condition={condition} />
      <div className="relative z-10 flex h-full w-full flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-widest text-white/70">
              Willkommen
            </div>
            <div className="mt-1 text-4xl font-semibold tracking-tight">{g}</div>
            <div className="mt-2 flex items-center gap-1.5 text-sm text-white/72">
              <MapPin className="h-3.5 w-3.5" />
              <span>{weather?.stationName ?? `PLZ ${postalCode}`}</span>
            </div>
          </div>
          <button
            type="button"
            className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/75 transition hover:bg-white/15"
            onClick={() => setPostalCode("")}
          >
            PLZ
          </button>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <WeatherIcon className="h-10 w-10 text-white/90" />
              <div className="text-5xl font-semibold tabular-nums tracking-tight">
                {formatTemperature(weather?.temperatureC)}
              </div>
            </div>
            <div className="mt-2 text-sm text-white/72">
              {loading && !weather ? "Wetter wird geladen" : (weather?.conditionLabel ?? error)}
            </div>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-x-4 gap-y-1 text-right text-xs text-white/72">
            <span>Min</span>
            <span className="font-medium text-white/90">{formatTemperature(weather?.minC)}</span>
            <span>Max</span>
            <span className="font-medium text-white/90">{formatTemperature(weather?.maxC)}</span>
            <span>Regen</span>
            <span className="font-medium text-white/90">
              {formatMillimeters(weather?.precipitationMm)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const WEATHER_POSTAL_CODE_KEY = "aura.weather.postalCode";

function readWeatherPostalCode(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(WEATHER_POSTAL_CODE_KEY) ?? "";
}

function WeatherBackdrop({ condition }: { condition: WeatherCondition }) {
  const tone = weatherTone(condition);
  return (
    <div className={`absolute inset-0 overflow-hidden ${tone}`}>
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(4,11,22,0.35),rgba(8,14,28,0.72))]" />
      <div className="weather-sun" />
      <div className="weather-cloud weather-cloud-a" />
      <div className="weather-cloud weather-cloud-b" />
      {condition === "rain" || condition === "storm" ? <div className="weather-rain" /> : null}
      {condition === "snow" ? <div className="weather-snow" /> : null}
      {condition === "fog" ? <div className="weather-fog" /> : null}
      {condition === "storm" ? <div className="weather-flash" /> : null}
    </div>
  );
}

function weatherTone(condition: WeatherCondition): string {
  switch (condition) {
    case "sunny":
      return "weather-tone-sunny";
    case "rain":
      return "weather-tone-rain";
    case "snow":
      return "weather-tone-snow";
    case "storm":
      return "weather-tone-storm";
    case "fog":
      return "weather-tone-fog";
    case "cloudy":
    default:
      return "weather-tone-cloudy";
  }
}

function weatherIcon(condition: WeatherCondition) {
  switch (condition) {
    case "sunny":
      return Sun;
    case "rain":
      return CloudRain;
    case "snow":
      return CloudSnow;
    case "storm":
      return CloudLightning;
    case "fog":
      return CloudFog;
    case "cloudy":
    default:
      return Cloud;
  }
}

function formatTemperature(value: number | null | undefined): string {
  return typeof value === "number" ? `${Math.round(value)}°` : "–";
}

function formatMillimeters(value: number | null | undefined): string {
  if (typeof value !== "number") return "–";
  if (value === 0) return "0 mm";
  return `${value.toLocaleString("de-DE", { maximumFractionDigits: 1 })} mm`;
}

export function HeroStatusWidget() {
  const status = useConnectionStore((s) => s.status);
  const disc = useDiscoveryStore((s) => s.state);
  const active = useSettingsStore((s) => s.activeServer());
  const hero = systemHeroMessage({
    connected: status === "connected" || status === "authenticated",
    discoveryReady: disc === "ready",
    syncing: disc === "syncing",
    serverName: active?.name,
  });
  const toneIcon =
    hero.tone === "ok" ? (
      <CheckCircle2 className="h-6 w-6 text-success" />
    ) : hero.tone === "warn" ? (
      <WifiOff className="h-6 w-6 text-destructive" />
    ) : (
      <Sparkles className="h-6 w-6 text-info" />
    );
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
