import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { RoomList } from "@/components/rooms/RoomList";
import { EmptyState } from "@/components/common/EmptyState";
import { GlassButton } from "@/components/glass/GlassButton";
import { useRoomsStore } from "@/store/slices/roomsStore";
import { Home } from "lucide-react";

export const Route = createFileRoute("/_app/rooms")({
  head: () => ({ meta: [{ title: "Räume · Smart Home" }] }),
  component: RoomsLayout,
});

function RoomsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isChild = pathname !== "/rooms";
  if (isChild) return <Outlet />;

  return <RoomsIndex />;
}

function RoomsIndex() {
  const rooms = useRoomsStore((s) => s.rooms);
  return (
    <>
      <PageHeader
        title="Räume"
        subtitle={`${rooms.length} ${rooms.length === 1 ? "Raum" : "Räume"}`}
        trailing={
          <GlassButton variant="ghost" size="sm" aria-label="Raum hinzufügen">
            <Plus className="h-4 w-4" />
          </GlassButton>
        }
      />
      {rooms.length === 0 ? (
        <EmptyState
          icon={Home}
          title="Noch keine Räume"
          description="Räume erscheinen hier, sobald der Server sie liefert."
        />
      ) : (
        <RoomList rooms={rooms} />
      )}
    </>
  );
}
