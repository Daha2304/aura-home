import { widgetRegistry } from "@/services/widgets/WidgetRegistry";
import { defineWidget } from "@/models/widgetDescriptor";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { useDiscoveryStore } from "@/store/slices/discoveryStore";
import { useRoomsStore } from "@/store/slices/roomsStore";
import { useHouseMetricsStore } from "@/store/slices/houseMetricsStore";
import { DeviceIcon } from "@/components/devices/DeviceIcon";
import { Wifi, WifiOff, Heart, Radar, Cpu, Home } from "lucide-react";

const layouts = [
  "phone-portrait",
  "phone-landscape",
  "tablet-portrait",
  "tablet-landscape",
  "desktop",
] as const;

function DeviceCountWidget() {
  const total = useDevicesStore((s) => s.devices.length);
  return (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Cpu className="h-4 w-4" /> Geräte
      </div>
      <div>
        <div className="text-3xl font-semibold">{total}</div>
        <div className="text-xs text-muted-foreground">insgesamt</div>
      </div>
    </div>
  );
}

function DeviceOnlineWidget() {
  const n = useDevicesStore((s) => s.devices.filter((d) => d.online).length);
  return (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Wifi className="h-4 w-4" /> Online
      </div>
      <div>
        <div className="text-3xl font-semibold text-[color:var(--success)]">{n}</div>
        <div className="text-xs text-muted-foreground">Geräte online</div>
      </div>
    </div>
  );
}

function DeviceOfflineWidget() {
  const n = useDevicesStore((s) => s.devices.filter((d) => !d.online).length);
  return (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <WifiOff className="h-4 w-4" /> Offline
      </div>
      <div>
        <div className="text-3xl font-semibold">{n}</div>
        <div className="text-xs text-muted-foreground">nicht erreichbar</div>
      </div>
    </div>
  );
}

function DeviceFavoritesWidget() {
  const favs = useDevicesStore((s) => s.devices.filter((d) => d.favorite));
  return (
    <div className="flex h-full flex-col gap-2 p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Heart className="h-4 w-4" /> Favoriten
      </div>
      {favs.length === 0 ? (
        <div className="text-xs text-muted-foreground">Noch keine Favoriten.</div>
      ) : (
        <ul className="flex-1 space-y-1 overflow-hidden text-sm">
          {favs.slice(0, 5).map((d) => (
            <li key={d.id} className="flex items-center gap-2 truncate">
              <DeviceIcon type={d.type} className="h-3.5 w-3.5 text-accent" />
              <span className="truncate">{d.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LatestDevicesWidget() {
  const latest = useDevicesStore((s) =>
    [...s.devices].sort((a, b) => (b.lastSeen ?? 0) - (a.lastSeen ?? 0)).slice(0, 5),
  );
  return (
    <div className="flex h-full flex-col gap-2 p-4">
      <div className="text-sm font-semibold">Zuletzt aktiv</div>
      {latest.length === 0 ? (
        <div className="text-xs text-muted-foreground">Keine Geräte.</div>
      ) : (
        <ul className="space-y-1 text-sm">
          {latest.map((d) => (
            <li key={d.id} className="flex items-center gap-2 truncate">
              <DeviceIcon type={d.type} className="h-3.5 w-3.5 text-accent" />
              <span className="truncate">{d.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DiscoveryStatusWidget() {
  const state = useDiscoveryStore((s) => s.state);
  const stats = useDiscoveryStore((s) => s.stats);
  const label: Record<typeof state, string> = {
    idle: "Bereit",
    discovering: "Suche läuft",
    syncing: "Synchronisiert",
    ready: "Bereit",
  } as const;
  return (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Radar className="h-4 w-4" /> Discovery
      </div>
      <div>
        <div className="text-xl font-semibold">{label[state]}</div>
        <div className="text-xs text-muted-foreground">
          {stats.devices} Geräte · {stats.fullSyncs} Full
        </div>
      </div>
    </div>
  );
}

function RoomSummaryWidget() {
  const rooms = useRoomsStore((s) => s.rooms.length);
  const house = useHouseMetricsStore((s) => s.metrics);
  return (
    <div className="flex h-full flex-col gap-2 p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Home className="h-4 w-4" /> Zuhause
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-foreground/5 p-2">
          <div className="text-xs text-muted-foreground">Räume</div>
          <div className="text-lg font-semibold">{rooms}</div>
        </div>
        <div className="rounded-xl bg-foreground/5 p-2">
          <div className="text-xs text-muted-foreground">Geräte</div>
          <div className="text-lg font-semibold">{house?.devices ?? 0}</div>
        </div>
        <div className="rounded-xl bg-foreground/5 p-2">
          <div className="text-xs text-muted-foreground">Online</div>
          <div className="text-lg font-semibold text-[color:var(--success)]">{house?.online ?? 0}</div>
        </div>
        <div className="rounded-xl bg-foreground/5 p-2">
          <div className="text-xs text-muted-foreground">Warnungen</div>
          <div className="text-lg font-semibold">{house?.warnings ?? 0}</div>
        </div>
      </div>
    </div>
  );
}

const descriptors = [
  defineWidget({
    id: "device.count",
    name: "Geräteanzahl",
    category: "devices",
    description: "Gesamtzahl aller Geräte.",
    icon: "cpu",
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 6, h: 3 },
    supportedLayouts: [...layouts],
    settings: [],
    capabilities: ["themeable", "movable", "resizable"],
    version: 1,
    render: () => <DeviceCountWidget />,
  }),
  defineWidget({
    id: "device.online",
    name: "Online-Geräte",
    category: "devices",
    description: "Anzahl online erreichbarer Geräte.",
    icon: "wifi",
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 6, h: 3 },
    supportedLayouts: [...layouts],
    settings: [],
    capabilities: ["themeable", "movable", "resizable"],
    version: 1,
    render: () => <DeviceOnlineWidget />,
  }),
  defineWidget({
    id: "device.offline",
    name: "Offline-Geräte",
    category: "devices",
    description: "Nicht erreichbare Geräte.",
    icon: "wifi-off",
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 6, h: 3 },
    supportedLayouts: [...layouts],
    settings: [],
    capabilities: ["themeable", "movable", "resizable"],
    version: 1,
    render: () => <DeviceOfflineWidget />,
  }),
  defineWidget({
    id: "device.favorites",
    name: "Favoriten",
    category: "favorites",
    description: "Als Favorit markierte Geräte.",
    icon: "heart",
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    maxSize: { w: 8, h: 5 },
    supportedLayouts: [...layouts],
    settings: [],
    capabilities: ["themeable", "movable", "resizable"],
    version: 1,
    render: () => <DeviceFavoritesWidget />,
  }),
  defineWidget({
    id: "device.latest",
    name: "Zuletzt aktiv",
    category: "devices",
    description: "Zuletzt aktive Geräte.",
    icon: "activity",
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    maxSize: { w: 8, h: 5 },
    supportedLayouts: [...layouts],
    settings: [],
    capabilities: ["themeable", "movable", "resizable"],
    version: 1,
    render: () => <LatestDevicesWidget />,
  }),
  defineWidget({
    id: "device.discovery-status",
    name: "Discovery-Status",
    category: "devices",
    description: "Aktueller Zustand der Geräteerkennung.",
    icon: "radar",
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 6, h: 3 },
    supportedLayouts: [...layouts],
    settings: [],
    capabilities: ["themeable", "movable", "resizable"],
    version: 1,
    render: () => <DiscoveryStatusWidget />,
  }),
  defineWidget({
    id: "device.room-summary",
    name: "Zuhause-Zusammenfassung",
    category: "devices",
    description: "Live-Kennzahlen zu Räumen und Geräten.",
    icon: "home",
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    maxSize: { w: 8, h: 4 },
    supportedLayouts: [...layouts],
    settings: [],
    capabilities: ["themeable", "movable", "resizable"],
    version: 1,
    render: () => <RoomSummaryWidget />,
  }),
];

let registered = false;

export function registerDeviceWidgets(): void {
  if (registered) return;
  registered = true;
  for (const d of descriptors) widgetRegistry.register(d);
}

export const DEVICE_WIDGET_IDS = descriptors.map((d) => d.id);
