import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft, Cpu } from "lucide-react";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { EmptyStateCard } from "@/components/ds/cards/EmptyStateCard";
import { PageTransition } from "@/components/ds/motion/PageTransition";
import { DevicePanelRenderer } from "@/components/devices/detail/DevicePanelRenderer";
import { useDeviceGestures } from "@/hooks/useDeviceGestures";

export const Route = createFileRoute("/_app/devices/$deviceId")({
  component: DeviceDetail,
  notFoundComponent: DeviceNotFound,
});

function DeviceDetail() {
  const { deviceId } = Route.useParams();
  const device = useDevicesStore((s) => s.byId(deviceId));
  const gestures = useDeviceGestures({ deviceId });
  if (!device) throw notFound();

  return (
    <PageTransition>
      <div {...gestures}>
        <div className="mb-3">
          <Link
            to="/devices"
            className="inline-flex items-center gap-1 text-sm text-accent hover:opacity-80"
          >
            <ChevronLeft className="h-4 w-4" /> Geräte
          </Link>
        </div>
        <DevicePanelRenderer device={device} />
      </div>
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
