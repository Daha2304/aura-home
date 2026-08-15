import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  Laptop,
  Pencil,
  RefreshCw,
  Router,
  Save,
  Search,
  Server,
  Smartphone,
  Wifi,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassInput } from "@/components/ds/controls/GlassInput";
import { EmptyStateCard } from "@/components/ds/cards/EmptyStateCard";
import { SectionCard } from "@/components/ds/cards/SectionCard";
import { StatusBadge } from "@/components/ds/controls/StatusBadge";
import { cn } from "@/lib/utils";

const OVERRIDE_KEY = "aura.networkDeviceOverrides.v1";

interface NetworkDevice {
  ip: string;
  mac?: string;
  hostname?: string;
  vendor?: string;
  type: string;
  online: boolean;
  source: string;
  lastSeen: string;
  ports?: number[];
  services?: string[];
  confidence?: "sicher" | "geschätzt" | "unbekannt";
}

interface NetworkScanResult {
  scannedAt: string;
  network: string;
  method: string;
  devices: NetworkDevice[];
}

interface DeviceOverride {
  name?: string;
  type?: string;
  hidden?: boolean;
}

export const Route = createFileRoute("/_app/settings/network-devices")({
  head: () => ({ meta: [{ title: "Netzwerkgeräte · Einstellungen" }] }),
  component: NetworkDevicesPage,
});

function NetworkDevicesPage() {
  const [scan, setScan] = useState<NetworkScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, DeviceOverride>>(() => loadOverrides());

  const load = async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/network-devices${refresh ? "?refresh=1" : ""}`);
      if (!response.ok) throw new Error(`Scan fehlgeschlagen (${response.status})`);
      setScan(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(false);
  }, []);

  const mergedDevices = useMemo(
    () =>
      (scan?.devices ?? []).map((device) => ({
        ...device,
        override: overrides[device.mac ?? device.ip] ?? overrides[device.ip],
      })),
    [overrides, scan?.devices],
  );

  const visibleDevices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mergedDevices.filter((device) => {
      if (device.override?.hidden && !showHidden) return false;
      if (!q) return true;
      return [
        displayName(device),
        device.ip,
        device.mac,
        displayType(device),
        device.vendor,
        device.hostname,
        device.ports?.join(","),
        device.services?.join(" "),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [mergedDevices, query, showHidden]);

  const online = mergedDevices.filter((device) => device.online).length;
  const hidden = mergedDevices.filter((device) => device.override?.hidden).length;

  const saveOverride = (device: NetworkDevice, override: DeviceOverride) => {
    const key = device.mac ?? device.ip;
    const next = { ...overrides, [key]: compactOverride(override) };
    if (Object.keys(next[key] ?? {}).length === 0) {
      delete next[key];
    }
    setOverrides(next);
    saveOverrides(next);
    setEditing(null);
  };

  return (
    <>
      <Link to="/settings" className="mb-2 inline-flex items-center gap-1 text-sm text-accent">
        <ChevronLeft className="h-4 w-4" /> Einstellungen
      </Link>
      <PageHeader
        title="Netzwerkgeräte"
        subtitle={scan ? `${visibleDevices.length} angezeigt · ${online} online · ${scan.network}` : "Lokaler Netzwerkscan"}
        trailing={
          <GlassButton variant="ghost" onClick={() => void load(true)} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Scannen
          </GlassButton>
        }
      />

      <div className="mb-3 grid grid-cols-3 gap-2">
        <SummaryCard label="Gefunden" value={scan?.devices.length ?? 0} />
        <SummaryCard label="Online" value={online} />
        <SummaryCard label="Ausgeblendet" value={hidden} />
      </div>

      <div className="mb-3 flex gap-2">
        <GlassInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Gerät, IP oder Hersteller suchen ..."
          aria-label="Netzwerkgeräte suchen"
        />
        <button
          type="button"
          onClick={() => setShowHidden((value) => !value)}
          className={cn(
            "shrink-0 rounded-full border border-border/60 px-4 text-sm font-medium",
            showHidden ? "bg-primary text-primary-foreground" : "bg-surface/40 text-muted-foreground",
          )}
        >
          Versteckte
        </button>
      </div>

      {error ? (
        <EmptyStateCard icon={Wifi} title="Scan nicht möglich" description={error} />
      ) : loading && !scan ? (
        <EmptyStateCard icon={RefreshCw} title="Scanne Netzwerk" description="Aura Home sucht Geräte im lokalen Netzwerk." />
      ) : visibleDevices.length === 0 ? (
        <EmptyStateCard
          icon={Search}
          title="Keine Geräte"
          description={query ? "Kein Gerät passt zur Suche." : "Starte einen neuen Scan."}
        />
      ) : (
        <SectionCard bare className="gap-2">
          {visibleDevices.map((device) =>
            editing === (device.mac ?? device.ip) ? (
              <EditDeviceRow
                key={device.mac ?? device.ip}
                device={device}
                onCancel={() => setEditing(null)}
                onSave={(override) => saveOverride(device, override)}
              />
            ) : (
              <DeviceRow
                key={device.mac ?? device.ip}
                device={device}
                onEdit={() => setEditing(device.mac ?? device.ip)}
              />
            ),
          )}
        </SectionCard>
      )}

      {scan && (
        <div className="mt-3 px-1 text-center text-xs text-muted-foreground">
          Zuletzt gescannt {new Date(scan.scannedAt).toLocaleTimeString()} · Methode {scan.method}
        </div>
      )}
    </>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <GlassCard className="p-3 text-center">
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </GlassCard>
  );
}

function DeviceRow({
  device,
  onEdit,
}: {
  device: NetworkDevice & { override?: DeviceOverride };
  onEdit: () => void;
}) {
  const Icon = iconForType(displayType(device));
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl px-3 py-3", device.override?.hidden && "opacity-50")}>
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{displayName(device)}</div>
        <div className="truncate font-mono text-[11px] text-muted-foreground">
          {device.ip}{device.mac ? ` · ${device.mac}` : ""}
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          <StatusBadge tone={device.online ? "success" : "neutral"}>
            {device.online ? "online" : "offline"}
          </StatusBadge>
          <StatusBadge tone="neutral">{displayType(device)}</StatusBadge>
          {device.confidence && (
            <StatusBadge tone={device.confidence === "sicher" ? "success" : device.confidence === "geschätzt" ? "info" : "neutral"}>
              {device.confidence}
            </StatusBadge>
          )}
          {device.vendor && <StatusBadge tone="neutral">{device.vendor}</StatusBadge>}
          {device.ports && device.ports.length > 0 && (
            <StatusBadge tone="info">Ports {device.ports.slice(0, 4).join(", ")}</StatusBadge>
          )}
          {device.services && device.services.length > 0 && (
            <StatusBadge tone="neutral">{device.services.slice(0, 2).join(", ")}</StatusBadge>
          )}
          {device.override?.hidden && <StatusBadge tone="warning">versteckt</StatusBadge>}
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border/60 bg-surface/40 text-muted-foreground"
        aria-label={`${displayName(device)} bearbeiten`}
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  );
}

function EditDeviceRow({
  device,
  onCancel,
  onSave,
}: {
  device: NetworkDevice & { override?: DeviceOverride };
  onCancel: () => void;
  onSave: (override: DeviceOverride) => void;
}) {
  const [name, setName] = useState(device.override?.name ?? displayName(device));
  const [type, setType] = useState(device.override?.type ?? device.type);
  const [hidden, setHidden] = useState(Boolean(device.override?.hidden));

  return (
    <div className="rounded-2xl border border-border/50 bg-surface/35 p-3">
      <div className="mb-3 font-mono text-[11px] text-muted-foreground">{device.ip}</div>
      <div className="grid gap-2">
        <GlassInput value={name} onChange={(event) => setName(event.target.value)} aria-label="Gerätename" />
        <select
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="h-11 rounded-full border border-border/60 bg-surface/50 px-4 text-sm outline-none"
          aria-label="Gerätetyp"
        >
          {DEVICE_TYPES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <label className="flex items-center justify-between rounded-2xl border border-border/40 px-3 py-2 text-sm">
          Ausblenden
          <input type="checkbox" checked={hidden} onChange={(event) => setHidden(event.target.checked)} />
        </label>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-full px-4 py-2 text-sm text-muted-foreground">
          Abbrechen
        </button>
        <button
          type="button"
          onClick={() => onSave({ name, type, hidden })}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          <Save className="h-4 w-4" />
          Speichern
        </button>
      </div>
    </div>
  );
}

const DEVICE_TYPES = [
  "Unbekannt",
  "Router",
  "Repeater",
  "Aura-Server",
  "Smart-Home-Server",
  "Proxmox",
  "DNS/Pi-hole",
  "Server",
  "Mac/PC",
  "Apple-Gerät",
  "Android/TV",
  "Smartphone",
  "Tablet",
  "TV",
  "AV-Receiver",
  "Media-Player",
  "NAS",
  "ESPHome",
  "Hyperion",
  "Shelly",
  "WLED",
  "Smart-Home-Gerät",
  "Drucker",
];

function displayName(device: NetworkDevice & { override?: DeviceOverride }): string {
  return device.override?.name || device.hostname || device.vendor || `Gerät ${device.ip}`;
}

function displayType(device: NetworkDevice & { override?: DeviceOverride }): string {
  return device.override?.type || device.type || "Unbekannt";
}

function iconForType(type: string) {
  const value = type.toLowerCase();
  if (value.includes("router")) return Router;
  if (value.includes("server")) return Server;
  if (value.includes("phone") || value.includes("smartphone") || value.includes("android")) return Smartphone;
  return Laptop;
}

function loadOverrides(): Record<string, DeviceOverride> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(OVERRIDE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveOverrides(overrides: Record<string, DeviceOverride>) {
  window.localStorage.setItem(OVERRIDE_KEY, JSON.stringify(overrides));
}

function compactOverride(override: DeviceOverride): DeviceOverride {
  const next: DeviceOverride = {};
  if (override.name?.trim()) next.name = override.name.trim();
  if (override.type?.trim()) next.type = override.type.trim();
  if (override.hidden) next.hidden = true;
  return next;
}
