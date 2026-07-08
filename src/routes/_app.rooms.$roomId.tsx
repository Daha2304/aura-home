import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DeviceList } from "@/components/devices/DeviceList";
import { useRoomsStore } from "@/store/slices/roomsStore";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { EmptyState } from "@/components/common/EmptyState";
import { Home } from "lucide-react";

export const Route = createFileRoute("/_app/rooms/$roomId")({
  component: RoomDetail,
  notFoundComponent: RoomNotFound,
});

function RoomDetail() {
  const { roomId } = Route.useParams();
  const room = useRoomsStore((s) => s.rooms.find((r) => r.id === roomId));
  const devices = useDevicesStore((s) =>
    s.devices.filter((d) => d.roomId === roomId),
  );

  if (!room) {
    throw notFound();
  }

  return (
    <>
      <Link
        to="/rooms"
        className="mb-2 inline-flex items-center gap-1 text-sm text-accent"
      >
        <ChevronLeft className="h-4 w-4" /> Räume
      </Link>
      <PageHeader
        title={room.name}
        subtitle={`${devices.length} Gerät${devices.length === 1 ? "" : "e"}`}
      />
      <DeviceList devices={devices} />
    </>
  );
}

function RoomNotFound() {
  return (
    <EmptyState
      icon={Home}
      title="Raum nicht gefunden"
      description="Dieser Raum existiert nicht mehr."
    />
  );
}
