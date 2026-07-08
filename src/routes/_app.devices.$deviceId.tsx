import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft, Cpu, Heart, Radar, Signal, Battery, Cog } from "lucide-react";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { useRoomsStore } from "@/store/slices/roomsStore";
import { deviceRegistry } from "@/services/registry/DeviceRegistry";
import { devicePresentationRegistry } from "@/services/devices/presentation";
import { HeroCard } from "@/components/ds/cards/HeroCard";
import { SectionCard } from "@/components/ds/cards/SectionCard";
import { StatusCard } from "@/components/ds/cards/StatusCard";
import { MetricCard } from "@/components/ds/cards/MetricCard";
import { EmptyStateCard } from "@/components/ds/cards/EmptyStateCard";
import { InfoCard } from "@/components/ds/cards/InfoCard";
import { StatusBadge } from "@/components/ds/controls/StatusBadge";
import { IconButton } from "@/components/ds/controls/IconButton";
import { PageTransition } from "@/components/ds/motion/PageTransition";
import { DeviceIcon } from "@/components/devices/DeviceIcon";
import { DeviceStatusChips } from "@/components/devices/renderer/DeviceStatusChips";
import { layoutIds } from "@/components/ds/motion/SharedLayout";

export const Route = createFileRoute("/_app/devices/$deviceId")({
  component: DeviceDetail,
  notFoundComponent: DeviceNotFound,
});

function DeviceDetail() {
  const { deviceId } = Route.useParams();
  const device = useDevicesStore((s) => s.byId(deviceId));
  const room = useRoomsStore((s) =>
    device?.roomId ? s.byId[device.roomId] : undefined,
  );
  if (!device) throw notFound();

  const desc = deviceRegistry.get(device.type);
  const presenter = devicePresentationRegistry.resolve(device);
  const flags = device.capabilityFlags ?? deviceRegistry.getCapabilities(device.type);

  const toggleFavorite = () =>
    useDevicesStore.getState().upsertDevice({ ...device, favorite: !device.favorite });

  const rows: Array<{ label: string; value: string }> = [
    { label: "Typ", value: desc?.name ?? device.type },
    { label: "Kategorie", value: desc?.category ?? "—" },
    { label: "Hersteller", value: device.manufacturer ?? "—" },
    { label: "Modell", value: device.model ?? "—" },
    { label: "Firmware", value: device.firmware ?? "—" },
    { label: "Hardware", value: device.hardwareVersion ?? "—" },
    { label: "Software", value: device.softwareVersion ?? "—" },
    { label: "UUID", value: device.uuid ?? "—" },
    { label: "MAC", value: device.mac ?? "—" },
    { label: "Serial", value: device.serial ?? "—" },
    { label: "Lifecycle", value: device.lifecycle ?? "—" },
  ];

  return (
    <PageTransition>
      <div className="mb-3">
        <Link to="/devices" className="inline-flex items-center gap-1 text-sm text-accent hover:opacity-80">
          <ChevronLeft className="h-4 w-4" /> Geräte
        </Link>
      </div>

      <HeroCard
        layoutId={layoutIds.deviceCard(device.id)}
        title={device.name}
        subtitle={room?.name ?? desc?.name ?? device.type}
        accent={presenter.accent}
        icon={<DeviceIcon type={device.type} className="h-6 w-6" />}
        actions={
          <IconButton
            aria-label={device.favorite ? "Favorit entfernen" : "Als Favorit"}
            onClick={toggleFavorite}
          >
            <Heart className={device.favorite ? "h-4 w-4 fill-current text-destructive" : "h-4 w-4"} />
          </IconButton>
        }
      >
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <StatusBadge tone={device.online ? "success" : "neutral"}>
            {device.online ? "Online" : "Offline"}
          </StatusBadge>
          <DeviceStatusChips device={device} />
        </div>
      </HeroCard>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Signal"
          value={typeof device.signal === "number" ? device.signal : "—"}
          unit={typeof device.signal === "number" ? "%" : undefined}
          icon={<Signal className="h-4 w-4" />}
        />
        <MetricCard
          label="Batterie"
          value={typeof device.battery === "number" ? device.battery : "—"}
          unit={typeof device.battery === "number" ? "%" : undefined}
          icon={<Battery className="h-4 w-4" />}
        />
        <StatusCard
          label="Discovery"
          value={device.lifecycle ?? "—"}
          icon={<Radar className="h-4 w-4" />}
          tone={device.lifecycle === "error" ? "danger" : device.lifecycle === "ready" ? "success" : "info"}
        />
        <StatusCard
          label="Version"
          value={String(device.version ?? "—")}
          icon={<Cog className="h-4 w-4" />}
        />
      </div>

      <SectionCard title="Informationen" className="mt-4">
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.label} className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-1 last:border-b-0">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">{r.label}</dt>
              <dd className="max-w-[60%] truncate text-sm font-medium">{r.value}</dd>
            </div>
          ))}
        </dl>
      </SectionCard>

      <SectionCard title="Capabilities" className="mt-4">
        {flags.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Capabilities gemeldet.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {flags.map((f) => (
              <span key={f} className="glass-panel hairline rounded-full px-3 py-1 text-xs">
                {f.replace(/^supports/, "")}
              </span>
            ))}
          </div>
        )}
      </SectionCard>

      {device.tags && device.tags.length > 0 && (
        <SectionCard title="Tags" className="mt-4">
          <div className="flex flex-wrap gap-1.5">
            {device.tags.map((t) => (
              <StatusBadge key={t} tone="accent">
                {t}
              </StatusBadge>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Verlauf" className="mt-4">
        <InfoCard>Historische Werte werden in einem späteren Schritt ergänzt.</InfoCard>
      </SectionCard>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Gerätesteuerung wird im nächsten Teil aktiviert.
      </p>
    </PageTransition>
  );
}

function DeviceNotFound() {
  return (
    <EmptyStateCard
      icon={Cpu}
      title="Gerät nicht gefunden"
      description="Dieses Gerät existiert nicht mehr."
    />
  );
}
