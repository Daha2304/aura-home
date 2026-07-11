import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Cpu } from "lucide-react";
import { useEffect } from "react";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { useDiscoveryStore } from "@/store/slices/discoveryStore";
import { EmptyStateCard } from "@/components/ds/cards/EmptyStateCard";
import { PageTransition } from "@/components/ds/motion/PageTransition";
import { DevicePanelRenderer } from "@/components/devices/detail/DevicePanelRenderer";
import { useDeviceGestures } from "@/hooks/useDeviceGestures";
import { discoveryEngine } from "@/services/discovery/DiscoveryEngine";

export const Route = createFileRoute("/_app/devices/$deviceId")({
  component: DeviceDetail,
});

function DeviceDetail() {
  const { deviceId } = Route.useParams();
  const device = useDevicesStore((s) => s.byId(deviceId));
  const discoveryState = useDiscoveryStore((s) => s.state);
  const gestures = useDeviceGestures({ deviceId });

  useEffect(() => {
    if (!device) discoveryEngine.requestFullSync();
  }, [device]);

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
        {device ? (
          <DevicePanelRenderer device={device} />
        ) : (
          <DeviceNotFound loading={discoveryState === "syncing" || discoveryState === "idle"} />
        )}
      </div>
    </PageTransition>
  );
}

function DeviceNotFound({ loading }: { loading: boolean }) {
  return (
    <EmptyStateCard
      icon={Cpu}
      title={loading ? "Gerät wird geladen" : "Gerät nicht gefunden"}
      description={
        loading
          ? "Aura synchronisiert gerade die Geräteliste."
          : "Dieses Gerät wurde im aktuellen Snapshot nicht gefunden."
      }
    />
  );
}
