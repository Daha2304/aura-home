import { SectionTitle } from "@/components/common/SectionTitle";
import { useRoomsStore } from "@/store/slices/roomsStore";
import { RoomList } from "@/components/rooms/RoomList";
import { EmptyState } from "@/components/common/EmptyState";
import { Home } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function RoomsWidget() {
  const rooms = useRoomsStore((s) => s.rooms.slice(0, 4));
  return (
    <section className="space-y-2">
      <SectionTitle
        action={
          <Link to="/rooms" className="text-xs font-medium text-accent">
            Alle
          </Link>
        }
      >
        Räume
      </SectionTitle>
      {rooms.length === 0 ? (
        <EmptyState icon={Home} title="Noch keine Räume" />
      ) : (
        <RoomList rooms={rooms} />
      )}
    </section>
  );
}
