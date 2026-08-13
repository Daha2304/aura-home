import { useEffect, useMemo, useRef, useState } from "react";
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
  Flame,
  Thermometer,
  Wind,
  Volume2,
  Music2,
  Power,
  Send,
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
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Device } from "@/models/device";
import type { DeviceFunction } from "@/models/device";
import { commandQueue } from "@/services/commands/CommandQueue";

const MARANTZ_VOLUME_BACKGROUND =
  "https://i.pinimg.com/originals/bd/e3/e1/bde3e16f060043de9e2ebc624fb64049.gif";

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

function CenteredTileTitle({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-center">
      <TileTitle icon={icon}>{children}</TileTitle>
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
      <CenteredTileTitle icon={<Clock className="h-3 w-3" />}>Uhrzeit</CenteredTileTitle>
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
      <CenteredTileTitle icon={<Calendar className="h-3 w-3" />}>Datum</CenteredTileTitle>
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
    <div className="grid h-full w-full grid-rows-[auto_minmax(0,1fr)] px-6 py-4">
      <div className="flex justify-center">
        <TileTitle icon={<Server className="h-3 w-3" />}>Systemstatus</TileTitle>
      </div>
      <div className="grid min-h-0 grid-cols-2 grid-rows-2 place-items-center gap-x-6 gap-y-2 py-1">
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
      <CenteredTileTitle icon={<DoorOpen className="h-3 w-3" />}>Fenster & Türen</CenteredTileTitle>
      {open.length === 0 ? (
        <WidgetOkState title="Alles geschlossen" detail="Keine offenen Kontakte" />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 overflow-hidden text-center">
          <div className="text-lg font-semibold tracking-tight text-warning">
            {open.length} offen
          </div>
          <div className="w-full space-y-1 overflow-hidden">
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
      <CenteredTileTitle icon={<BatteryWarning className="h-3 w-3" />}>Batterien</CenteredTileTitle>
      {low.length === 0 ? (
        <WidgetOkState title="Batterien ok" detail="Keine niedrigen Werte" />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 overflow-hidden text-center">
          <div className="text-lg font-semibold tracking-tight text-warning">
            {low.length} niedrig
          </div>
          <div className="w-full space-y-1 overflow-hidden">
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

export function HeatingControlWidget() {
  const devices = useDevicesStore((s) => s.devices);
  const rooms = useRoomsStore((s) => s.byId);
  const heatingDevices = devices
    .filter(isHeatingDevice)
    .map((device) => ({
      device,
      power: findPowerFunction(device),
      temperatures: readDeviceTemperatures(device),
    }))
    .slice(0, 4);

  return (
    <div className="grid h-full w-full grid-rows-[auto_1fr] p-4">
      <CenteredTileTitle icon={<Flame className="h-3 w-3" />}>Heizung</CenteredTileTitle>
      {heatingDevices.length === 0 ? (
        <WidgetEmptyState title="Keine Heizung" detail="Noch kein Heizungs-Alias gefunden" />
      ) : (
        <div className="flex flex-col justify-center gap-2 overflow-hidden">
          {heatingDevices.map(({ device, power, temperatures }) => (
            <ClimateControlLine
              key={device.id}
              device={device}
              roomName={device.roomId ? rooms[device.roomId]?.name : undefined}
              power={power}
              value={formatTemperatureList(temperatures)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TemperatureOverviewWidget() {
  const devices = useDevicesStore((s) => s.devices);
  const rooms = useRoomsStore((s) => s.byId);
  const temperatures = devices.flatMap((device) =>
    readDeviceTemperatures(device)
      .filter((entry) => entry.readonly !== false)
      .filter((entry) => !isTargetTemperature(entry.label, entry.id))
      .map((entry) => ({
        device,
        roomName: device.roomId ? rooms[device.roomId]?.name : undefined,
        ...entry,
      })),
  );

  const shown = temperatures
    .sort(
      (a, b) =>
        (a.roomName ?? "").localeCompare(b.roomName ?? "") ||
        a.device.name.localeCompare(b.device.name),
    )
    .slice(0, 6);

  return (
    <div className="grid h-full w-full grid-rows-[auto_1fr] p-4">
      <CenteredTileTitle icon={<Thermometer className="h-3 w-3" />}>Temperaturen</CenteredTileTitle>
      {shown.length === 0 ? (
        <WidgetEmptyState title="Keine Werte" detail="Noch keine Temperaturwerte gefunden" />
      ) : (
        <div className="grid min-h-0 content-center gap-1 overflow-hidden">
          {shown.map((entry) => (
            <CompactDeviceLine
              key={`${entry.device.id}-${entry.id}`}
              name={entry.device.name}
              detail={entry.roomName}
              value={formatNumberValue(entry.value, entry.unit ?? "°C")}
              tone="neutral"
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ClimateControlWidget() {
  const devices = useDevicesStore((s) => s.devices);
  const rooms = useRoomsStore((s) => s.byId);
  const climateDevices = devices
    .filter(isClimateDevice)
    .map((device) => ({
      device,
      power: findPowerFunction(device),
      temperatures: readDeviceTemperatures(device),
    }))
    .slice(0, 4);

  return (
    <div className="grid h-full w-full grid-rows-[auto_1fr] p-4">
      <CenteredTileTitle icon={<Wind className="h-3 w-3" />}>Klima</CenteredTileTitle>
      {climateDevices.length === 0 ? (
        <WidgetEmptyState title="Keine Klimageräte" detail="Noch kein Klima-Alias gefunden" />
      ) : (
        <div className="flex flex-col justify-center gap-2 overflow-hidden">
          {climateDevices.map(({ device, power, temperatures }) => (
            <ClimateControlLine
              key={device.id}
              device={device}
              roomName={device.roomId ? rooms[device.roomId]?.name : undefined}
              power={power}
              value={formatTemperatureList(temperatures)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function MotionSensorsOverviewWidget() {
  const devices = useDevicesStore((s) => s.devices);
  const rooms = useRoomsStore((s) => s.byId);
  const sensors = devices
    .filter(isLd2410Device)
    .map((device) => ({
      device,
      roomName: device.roomId ? rooms[device.roomId]?.name : undefined,
      values: readMotionSensorValues(device),
    }))
    .filter((entry) => entry.values.length > 0)
    .sort(
      (a, b) =>
        motionRoomOrder(a.roomName ?? a.device.name) -
          motionRoomOrder(b.roomName ?? b.device.name) ||
        (a.roomName ?? "").localeCompare(b.roomName ?? "") ||
        a.device.name.localeCompare(b.device.name),
    )
    .slice(0, 2);

  return (
    <div className="grid h-full w-full grid-rows-[auto_1fr] p-4">
      <CenteredTileTitle icon={<Radar className="h-3 w-3" />}>Bewegungssensoren</CenteredTileTitle>
      {sensors.length === 0 ? (
        <WidgetEmptyState title="Keine Sensoren" detail="Noch kein LD2410C-Alias gefunden" />
      ) : (
        <div className="grid min-h-0 grid-cols-2 content-center gap-3 overflow-hidden">
          {sensors.map(({ device, roomName, values }) => (
            <div
              key={device.id}
              className="min-w-0 rounded-2xl border border-border/45 bg-surface/25 px-3 py-2"
            >
              <div className="mb-2 truncate text-center text-sm font-semibold tracking-tight">
                {roomName ?? device.name}
              </div>
              <div className="space-y-1">
                {values.map((entry) => (
                  <MotionSensorLine key={entry.id} label={entry.label} value={entry.value} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MarantzRemoteWidget() {
  const devices = useDevicesStore((s) => s.devices);
  const rooms = useRoomsStore((s) => s.byId);
  const [open, setOpen] = useState(false);
  const marantz = useMemo(() => findMarantzDevice(devices), [devices]);
  const power = marantz ? findPowerFunction(marantz) : undefined;
  const volume = marantz ? findVolumeFunction(marantz) : undefined;
  const input = marantz ? findMarantzInputFunction(marantz) : undefined;
  const audio = marantz ? findMarantzAudioFunction(marantz, input?.id) : undefined;
  const roomName = marantz?.roomId ? rooms[marantz.roomId]?.name : undefined;

  if (!marantz) {
    return (
      <div className="grid h-full w-full grid-rows-[auto_1fr] p-4">
        <CenteredTileTitle icon={<Music2 className="h-3 w-3" />}>Marantz</CenteredTileTitle>
        <WidgetEmptyState title="Nicht gefunden" detail="Noch kein Marantz-Alias vorhanden" />
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group grid h-full w-full grid-rows-[auto_1fr] p-4 text-left outline-none"
        aria-label="Marantz Fernbedienung öffnen"
      >
        <CenteredTileTitle icon={<Music2 className="h-3 w-3" />}>Marantz</CenteredTileTitle>
        <div className="flex min-h-0 flex-col items-center justify-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-primary/15 text-primary transition-transform group-active:scale-95">
            <Volume2 className="h-7 w-7" />
          </div>
          <div className="w-full">
            <div className="text-lg font-semibold tracking-tight">Fernbedienung</div>
            <div className="text-xs text-muted-foreground">
              {[roomName, formatMarantzVolume(volume)].filter(Boolean).join(" · ") || "Bereit"}
            </div>
            <div className="mx-auto mt-3 grid max-w-[18rem] grid-cols-2 gap-2">
              <MarantzStatePill label="Input" value={formatFunctionValue(input)} />
              <MarantzStatePill label="Mixer" value={formatFunctionValue(audio)} />
            </div>
          </div>
        </div>
      </button>

      <MarantzRemoteDialog
        open={open}
        onClose={() => setOpen(false)}
        device={marantz}
        roomName={roomName}
        power={power}
        volume={volume}
        input={input}
        audio={audio}
      />
    </>
  );
}

function MarantzStatePill({ label, value }: { label: string; value?: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-border/40 bg-surface/30 px-3 py-2 text-center">
      <div className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="truncate text-sm font-semibold">{value || "–"}</div>
    </div>
  );
}

function MarantzRemoteDialog({
  open,
  onClose,
  device,
  roomName,
  power,
  volume,
  input,
  audio,
}: {
  open: boolean;
  onClose: () => void;
  device: Device;
  roomName?: string;
  power?: DeviceFunction;
  volume?: DeviceFunction;
  input?: DeviceFunction;
  audio?: DeviceFunction;
}) {
  const actions = useMemo(() => pickMarantzActions(device), [device]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] w-[min(92vw,28rem)] overflow-y-auto rounded-[2rem] border-border/50 bg-background/90 p-5 shadow-2xl backdrop-blur-xl">
        <DialogHeader className="pr-10 text-left">
          <DialogTitle className="text-2xl">Marantz</DialogTitle>
          <div className="text-sm text-muted-foreground">{roomName ?? "Wohnzimmer"}</div>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="rounded-[1.75rem] border border-border/45 bg-surface/35 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Power className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-semibold">Power</div>
                  <div className="text-xs text-muted-foreground">
                    {readBooleanValue(power?.value) ? "An" : "Aus"}
                  </div>
                </div>
              </div>
              {power ? <PowerSwitch device={device} fn={power} /> : <div className="h-6 w-11" />}
            </div>
          </div>

          {volume ? (
            <MarantzVolumeDial device={device} fn={volume} />
          ) : (
            <div className="rounded-[1.75rem] border border-border/45 bg-surface/35 p-5 text-center text-sm text-muted-foreground">
              Keine Lautstärke-Funktion gefunden
            </div>
          )}

          <div className="grid gap-3">
            {input ? <MarantzOptionSelect device={device} fn={input} label="Input" /> : null}
            {audio ? <MarantzOptionSelect device={device} fn={audio} label="Audio" /> : null}
          </div>

          {actions.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {actions.map((fn) => (
                <button
                  key={fn.id}
                  type="button"
                  onClick={() =>
                    commandQueue.enqueue(device.id, fn.id, actionCommandValue(fn), {
                      optimistic: true,
                    })
                  }
                  className="flex items-center justify-center gap-2 rounded-2xl border border-border/45 bg-surface/35 px-3 py-3 text-sm font-semibold transition-colors active:bg-primary/20"
                >
                  <Send className="h-4 w-4 text-primary" />
                  <span className="truncate">{cleanFunctionLabel(fn)}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PowerSwitch({ device, fn }: { device: Device; fn: DeviceFunction }) {
  const actualChecked = readBooleanValue(fn.value) ?? false;
  const [optimisticChecked, setOptimisticChecked] = useState<boolean | undefined>();
  const checked = optimisticChecked ?? actualChecked;

  useEffect(() => {
    if (optimisticChecked === undefined) return;
    if (actualChecked === optimisticChecked) setOptimisticChecked(undefined);
  }, [actualChecked, optimisticChecked]);

  return (
    <Switch
      checked={checked}
      aria-label={`${device.name} schalten`}
      onCheckedChange={(next) => {
        setOptimisticChecked(next);
        commandQueue.enqueue(device.id, fn.id, commandValueForBooleanToggle(device, fn, next), {
          optimistic: true,
        });
      }}
    />
  );
}

function MarantzVolumeDial({ device, fn }: { device: Device; fn: DeviceFunction }) {
  const min = typeof fn.min === "number" ? fn.min : 0;
  const max = typeof fn.max === "number" && fn.max > min ? fn.max : 98;
  const step = typeof fn.step === "number" && fn.step > 0 ? fn.step : 1;
  const actual = clampNumber(readNumberValue(fn.value) ?? min, min, max);
  const [localValue, setLocalValue] = useState(actual);
  const drag = useRef({ active: false, startValue: actual, lastAngle: 0, accumulatedAngle: 0 });
  const sendTimer = useRef<ReturnType<typeof window.setTimeout> | undefined>();

  useEffect(() => {
    if (!drag.current.active) setLocalValue(actual);
  }, [actual]);

  useEffect(
    () => () => {
      if (sendTimer.current) window.clearTimeout(sendTimer.current);
    },
    [],
  );

  const commit = (next: number) => {
    if (sendTimer.current) window.clearTimeout(sendTimer.current);
    sendTimer.current = window.setTimeout(() => {
      commandQueue.enqueue(device.id, fn.id, next, { optimistic: true });
    }, 90);
  };

  const setFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const angle = pointerAngle(event.clientX, event.clientY, rect);
    let delta = angle - drag.current.lastAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    drag.current.accumulatedAngle += delta;
    drag.current.lastAngle = angle;

    const valueDelta = (drag.current.accumulatedAngle / 360) * (max - min);
    const next = clampNumber(roundToStep(drag.current.startValue + valueDelta, step), min, max);
    setLocalValue(next);
    commit(next);
  };

  return (
    <div className="rounded-[1.75rem] border border-border/45 bg-surface/35 p-4">
      <div className="mb-3 flex items-center justify-center gap-2 text-sm font-semibold">
        <Volume2 className="h-4 w-4 text-primary" />
        Lautstärke
      </div>
      <div
        role="slider"
        aria-label="Marantz Lautstärke"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={Math.round(localValue)}
        tabIndex={0}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current.active = true;
          drag.current.startValue = localValue;
          drag.current.lastAngle = pointerAngle(
            event.clientX,
            event.clientY,
            event.currentTarget.getBoundingClientRect(),
          );
          drag.current.accumulatedAngle = 0;
        }}
        onPointerMove={(event) => {
          if (!drag.current.active) return;
          setFromPointer(event);
        }}
        onPointerUp={(event) => {
          drag.current.active = false;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          drag.current.active = false;
        }}
        className="relative mx-auto flex aspect-square w-[min(68vw,14rem)] touch-none select-none items-center justify-center overflow-hidden rounded-full border border-black/35 bg-background outline-none shadow-[0_22px_60px_rgba(0,0,0,.42)]"
        style={
          {
            backgroundImage: `url(${MARANTZ_VOLUME_BACKGROUND})`,
            backgroundSize: "290%",
            backgroundPosition: "center",
          } as React.CSSProperties
        }
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,18,38,.06)_0%,rgba(3,6,16,.18)_58%,rgba(0,0,0,.55)_100%)]" />
        <div className="relative text-center drop-shadow-[0_2px_14px_rgba(0,0,0,.75)]">
          <div className="text-5xl font-semibold tabular-nums tracking-tight text-white">
            {Math.round(localValue)}
          </div>
        </div>
      </div>
    </div>
  );
}

function MarantzOptionSelect({
  device,
  fn,
  label,
}: {
  device: Device;
  fn: DeviceFunction;
  label: string;
}) {
  const options = useMemo(() => readFunctionOptions(fn), [fn]);
  const value = String(fn.value ?? "");
  const shownOptions = options.includes(value) || value === "" ? options : [value, ...options];

  return (
    <label className="grid gap-2 rounded-[1.5rem] border border-border/45 bg-surface/35 p-4">
      <span className="flex items-center gap-2 text-sm font-semibold">
        <Music2 className="h-4 w-4 text-primary" />
        {label}
      </span>
      <select
        value={value}
        disabled={shownOptions.length === 0 || fn.readonly === true}
        onChange={(event) =>
          commandQueue.enqueue(device.id, fn.id, event.target.value, { optimistic: true })
        }
        className="h-11 w-full rounded-2xl border border-border/55 bg-background/75 px-4 text-sm font-semibold outline-none focus:border-primary/70"
      >
        {shownOptions.map((option) => (
          <option key={option} value={option} className="bg-background">
            {option}
          </option>
        ))}
      </select>
    </label>
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

function WidgetEmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="text-lg font-semibold tracking-tight">{title}</div>
      <div className="max-w-[14rem] text-xs text-muted-foreground">{detail}</div>
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
    <div className="mx-auto flex w-full min-w-0 max-w-[18rem] items-center justify-between gap-2 text-xs">
      <div className="min-w-0 text-left">
        <div className="truncate font-medium">{name}</div>
        {detail ? <div className="truncate text-[11px] text-muted-foreground">{detail}</div> : null}
      </div>
      <div className={tone === "warning" ? "shrink-0 font-medium text-warning" : "shrink-0"}>
        {value}
      </div>
    </div>
  );
}

function MotionSensorLine({ label, value }: { label: string; value: unknown }) {
  const bool = readBooleanValue(value);
  const shown = bool === undefined ? formatUnknownValue(value) : bool ? "Ja" : "Nein";

  return (
    <div className="flex min-w-0 items-center justify-between gap-2 text-xs">
      <span className="truncate text-muted-foreground">{label}</span>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
          bool === true
            ? "bg-success/20 text-success"
            : bool === false
              ? "bg-surface/50 text-muted-foreground"
              : "bg-warning/15 text-warning"
        }`}
      >
        {shown}
      </span>
    </div>
  );
}

function ClimateControlLine({
  device,
  roomName,
  power,
  value,
}: {
  device: Device;
  roomName?: string;
  power?: DeviceFunction;
  value?: string;
}) {
  const actualChecked = readBooleanValue(power?.value) ?? false;
  const [optimisticChecked, setOptimisticChecked] = useState<boolean | undefined>();
  const checked = optimisticChecked ?? actualChecked;

  useEffect(() => {
    if (optimisticChecked === undefined) return;
    if (actualChecked === optimisticChecked) setOptimisticChecked(undefined);
  }, [actualChecked, optimisticChecked]);

  return (
    <div className="mx-auto flex w-full max-w-[18rem] items-center justify-between gap-3 rounded-2xl border border-border/45 bg-surface/25 px-3 py-2">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold tracking-tight">{device.name}</div>
        <div className="truncate text-[11px] text-muted-foreground">
          {[roomName, value].filter(Boolean).join(" · ") || "Bereit"}
        </div>
      </div>
      {power ? (
        <Switch
          checked={checked}
          aria-label={`${device.name} schalten`}
          onCheckedChange={(next) => {
            setOptimisticChecked(next);
            commandQueue.enqueue(
              device.id,
              power.id,
              commandValueForBooleanToggle(device, power, next),
              {
                optimistic: true,
              },
            );
          }}
        />
      ) : (
        <div className="h-5 w-9 shrink-0" aria-hidden="true" />
      )}
    </div>
  );
}

interface TemperatureEntry {
  id: string;
  label?: string;
  value: number;
  unit?: string;
  readonly?: boolean;
}

function isHeatingDevice(device: Device): boolean {
  const type = device.type.toLowerCase();
  return (
    type === "thermostat" ||
    type === "heating" ||
    textMatches(device, ["heizung", "heating", "thermostat"])
  );
}

function isClimateDevice(device: Device): boolean {
  const type = device.type.toLowerCase();
  return (
    type === "ac" || textMatches(device, ["klima", "climate", "aircondition", "air condition"])
  );
}

function readBooleanValue(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "on", "an", "ein", "yes", "ja", "heat", "cool"].includes(normalized))
      return true;
    if (["false", "0", "off", "aus", "no", "nein", "idle", "standby"].includes(normalized))
      return false;
  }
  return undefined;
}

function commandValueForBooleanToggle(device: Device, fn: DeviceFunction, next: boolean): unknown {
  const currentValue = fn.value;
  if (typeof currentValue !== "string") return next;

  const normalized = currentValue.trim().toLowerCase();
  const text =
    `${device.id} ${device.name} ${device.type} ${fn.id} ${fn.label ?? ""} ${String(fn.meta?.role ?? "")}`.toLowerCase();
  if (normalized === "heat") return next ? "heat" : "off";
  if (normalized === "cool") return next ? "cool" : "off";
  if (normalized === "off" && textMatches(device, ["heizung", "heating", "thermostat", "heat"])) {
    return next ? "heat" : "off";
  }
  if (normalized === "off" && text.includes("cool")) return next ? "cool" : "off";
  if (normalized === "on" || normalized === "off") return next ? "on" : "off";
  if (normalized === "an" || normalized === "aus") return next ? "an" : "aus";
  if (normalized === "ein" || normalized === "aus") return next ? "ein" : "aus";
  if (normalized === "true" || normalized === "false") return next ? "true" : "false";
  if (normalized === "1" || normalized === "0") return next ? "1" : "0";

  return next;
}

function textMatches(device: Device, needles: string[]): boolean {
  const haystack = [
    device.id,
    device.name,
    device.type,
    ...(device.functions ?? []).flatMap((fn) => [fn.id, fn.label, String(fn.meta?.role ?? "")]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return needles.some((needle) => haystack.includes(needle));
}

function isLd2410Device(device: Device): boolean {
  return textMatches(device, ["ld2410"]);
}

function motionRoomOrder(name: string): number {
  const normalized = name.toLowerCase();
  if (normalized.includes("küche") || normalized.includes("kueche")) return 0;
  if (normalized.includes("flur")) return 1;
  return 10;
}

interface MotionSensorEntry {
  id: string;
  label: string;
  value: unknown;
}

function readMotionSensorValues(device: Device): MotionSensorEntry[] {
  const functions = device.functions ?? [];
  const ordered = [
    { key: "anwesenheit", label: "Anwesenheit" },
    { key: "bewegung", label: "Bewegung" },
    { key: "still", label: "Still" },
  ];

  return ordered
    .map((entry) => {
      const fn = functions.find((candidate) => motionFunctionMatches(candidate, entry.key));
      return fn ? { id: fn.id, label: entry.label, value: fn.value } : undefined;
    })
    .filter((entry): entry is MotionSensorEntry => Boolean(entry));
}

function motionFunctionMatches(fn: DeviceFunction, key: string): boolean {
  const text = functionText(fn);
  const compact = compactText(text);
  return compact.includes(key);
}

function formatUnknownValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "–";
  return String(value);
}

function findPowerFunction(device: Device): DeviceFunction | undefined {
  return (device.functions ?? []).find((fn) => {
    if (fn.readonly === true || readBooleanValue(fn.value) === undefined) return false;
    const text =
      `${fn.kind} ${fn.id} ${fn.label ?? ""} ${String(fn.meta?.role ?? "")}`.toLowerCase();
    return fn.kind === "power" || text.includes("switch.power") || text.includes("power");
  });
}

function findMarantzDevice(devices: Device[]): Device | undefined {
  return devices.find((device) => {
    const text = [
      device.id,
      device.name,
      device.type,
      device.manufacturer,
      device.model,
      ...(device.functions ?? []).flatMap((fn) => [
        fn.id,
        fn.label,
        String(fn.meta?.aliasId ?? ""),
      ]),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return text.includes("marantz") || text.includes("denon.");
  });
}

function findVolumeFunction(device: Device): DeviceFunction | undefined {
  return (device.functions ?? []).find((fn) => {
    if (fn.readonly === true) return false;
    if (readNumberValue(fn.value) === undefined) return false;
    const text = functionText(fn);
    return fn.kind === "volume" || text.includes("volume") || text.includes("lautst");
  });
}

function findMarantzInputFunction(device: Device): DeviceFunction | undefined {
  return findOptionFunction(device, (fn) => {
    const text = functionText(fn);
    const compact = compactText(text);
    if (compact.includes("surroundmode") || compact.includes("audio")) return 0;
    if (compact.includes("selectinput") || compact.includes("zoneMainselectInput".toLowerCase()))
      return 100;
    if (compact.includes("mediaquickselect")) return 80;
    if (compact.endsWith("input") || compact.includes("marantzinput")) return 70;
    if (/\binput\b/.test(text)) return 60;
    return 0;
  });
}

function findMarantzAudioFunction(device: Device, excludeId?: string): DeviceFunction | undefined {
  return findOptionFunction(device, (fn) => {
    if (fn.id === excludeId) return 0;
    const text = functionText(fn);
    const compact = compactText(text);
    if (compact.includes("selectinput")) return 0;
    if (compact.includes("surroundmode")) return 100;
    if (compact.includes("audio") || compact.includes("mixer")) return 80;
    if (compact.includes("soundmode")) return 70;
    if (compact.endsWith("mode") && !compact.includes("input")) return 45;
    return 0;
  });
}

function findOptionFunction(
  device: Device,
  score: (fn: DeviceFunction) => number,
): DeviceFunction | undefined {
  const candidates = (device.functions ?? []).filter((fn) => {
    if (fn.readonly === true) return false;
    const options = readFunctionOptions(fn);
    return options.length > 0 || typeof fn.value === "string";
  });

  return candidates
    .map((fn) => ({ fn, score: score(fn) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.fn;
}

function pickMarantzActions(device: Device): DeviceFunction[] {
  return (device.functions ?? [])
    .filter((fn) => fn.readonly !== true)
    .filter((fn) => {
      const text = functionText(fn);
      if (fn.kind !== "action" && !text.includes("button")) return false;
      if (text.includes("input") || text.includes("surround") || text.includes("volume"))
        return false;
      return true;
    })
    .slice(0, 8);
}

function functionText(fn: DeviceFunction): string {
  return [
    fn.kind,
    fn.id,
    fn.label,
    fn.unit,
    String(fn.meta?.role ?? ""),
    String(fn.meta?.aliasId ?? ""),
    String(fn.meta?.objectId ?? ""),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function compactText(value: string): string {
  return value.replace(/[\s_.-]/g, "");
}

function cleanFunctionLabel(fn: DeviceFunction): string {
  const label = String(fn.label || fn.id.split(".").pop() || "Aktion").trim();
  return label.replace(/^wohnzimmer\s+marantz\s+/i, "").replace(/^marantz\s+/i, "");
}

function readNumberValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function readFunctionOptions(fn: DeviceFunction): string[] {
  if (Array.isArray(fn.options)) {
    return fn.options.map(String).filter(Boolean);
  }

  const states = fn.meta?.states;
  if (Array.isArray(states)) return states.map(String).filter(Boolean);
  if (states && typeof states === "object") {
    const entries = Object.entries(states as Record<string, unknown>);
    return entries.map(([key]) => String(key)).filter(Boolean);
  }

  const commonStates = fn.meta?.commonStates;
  if (commonStates && typeof commonStates === "object") {
    const entries = Object.entries(commonStates as Record<string, unknown>);
    return entries.map(([key]) => String(key)).filter(Boolean);
  }

  return [];
}

function actionCommandValue(fn: DeviceFunction): unknown {
  if (fn.meta?.commandValue !== undefined) return fn.meta.commandValue;
  if (typeof fn.value === "string" && fn.value.length > 0) return fn.value;
  return true;
}

function formatMarantzVolume(fn?: DeviceFunction): string | undefined {
  const value = readNumberValue(fn?.value);
  if (value === undefined) return undefined;
  return `${Math.round(value)} %`;
}

function formatFunctionValue(fn?: DeviceFunction): string | undefined {
  if (fn?.value === undefined || fn.value === null || fn.value === "") return undefined;
  return String(fn.value);
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function pointerAngle(x: number, y: number, rect: DOMRect): number {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  return ((Math.atan2(y - centerY, x - centerX) * 180) / Math.PI + 360) % 360;
}

function readDeviceTemperatures(device: Device): TemperatureEntry[] {
  return (device.functions ?? [])
    .filter(
      (fn) =>
        fn.kind === "temperature" && typeof fn.value === "number" && Number.isFinite(fn.value),
    )
    .map((fn) => ({
      id: fn.id,
      label: fn.label,
      value: fn.value as number,
      unit: normalizeTemperatureUnit(fn.unit),
      readonly: fn.readonly,
    }));
}

function isTargetTemperature(label?: string, id?: string): boolean {
  const text = `${label ?? ""} ${id ?? ""}`.toLowerCase();
  return text.includes("ziel") || text.includes(".set") || text.endsWith(" set");
}

function normalizeTemperatureUnit(unit?: string): string {
  if (!unit) return "°C";
  return unit === "C" ? "°C" : unit;
}

function formatTemperatureList(entries: TemperatureEntry[]): string | undefined {
  const current =
    entries.find((entry) => !isTargetTemperature(entry.label, entry.id)) ?? entries[0];
  return current ? formatNumberValue(current.value, current.unit ?? "°C") : undefined;
}

function formatNumberValue(value: number, unit?: string): string {
  const formatted = Number.isInteger(value)
    ? String(value)
    : value.toLocaleString("de-DE", { maximumFractionDigits: 1 });
  return unit ? `${formatted} ${unit}` : formatted;
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
    <div className="flex min-w-0 flex-col items-center self-center overflow-hidden text-center">
      <div className="flex items-center justify-center gap-1.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div
        className={`mt-0.5 truncate text-base font-semibold leading-tight tracking-tight ${toneClass}`}
      >
        {value}
      </div>
      <div className="truncate text-[11px] leading-tight text-muted-foreground">{detail}</div>
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
