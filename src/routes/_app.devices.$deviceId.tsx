import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { DeviceIcon } from "@/components/devices/DeviceIcon";
import { DeviceStatusBadge } from "@/components/devices/DeviceStatusBadge";
import { ControlForCapability } from "@/components/devices/controls/ControlRegistry";
import { EmptyState } from "@/components/common/EmptyState";
import { GlassCard } from "@/components/glass/GlassCard";
import { Cpu } from "lucide-react";

export const Route = createFileRoute("/_app/devices/$deviceId")({
  component: DeviceDetail,
  notFoundComponent: DeviceNotFound,
});

function DeviceDetail() {
  const { deviceId } = Route.useParams();
  const device = useDevicesStore((s) => s.devices.find((d) => d.id === deviceId));
  if (!device) throw notFound();

  return (
    <>
      <Link
        to="/devices"
        className="mb-2 inline-flex items-center gap-1 text-sm text-accent"
      >
        <ChevronLeft className="h-4 w-4" /> Geräte
      </Link>
      <PageHeader
        title={device.name}
        subtitle={device.manufacturer ?? device.type}
        trailing={<DeviceStatusBadge online={device.online} />}
      />
      <GlassCard className="mb-4 flex items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent">
          <DeviceIcon type={device.type} className="h-7 w-7" />
        </div>
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground">Typ</div>
          <div className="truncate font-medium capitalize">{device.type}</div>
        </div>
      </GlassCard>

      {device.capabilities.length === 0 ? (
        <EmptyState
          icon={Cpu}
          title="Keine Funktionen"
          description="Dieses Gerät hat keine Steuerelemente."
        />
      ) : (
        <div className="space-y-3">
          {device.capabilities.map((c) => (
            <ControlForCapability key={c.id} device={device} capability={c} />
          ))}
        </div>
      )}
    </>
  );
}

function DeviceNotFound() {
  return (
    <EmptyState
      icon={Cpu}
      title="Gerät nicht gefunden"
      description="Dieses Gerät existiert nicht mehr."
    />
  );
}
