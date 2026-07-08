import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { Plus, Home, Radar, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { RoomList } from "@/components/rooms/RoomList";
import { RoomForm, type RoomFormValue } from "@/components/rooms/RoomForm";
import { useRoomsStore } from "@/store/slices/roomsStore";
import { roomManager } from "@/services/rooms";
import { HeroCard } from "@/components/ds/cards/HeroCard";
import { EmptyStateCard } from "@/components/ds/cards/EmptyStateCard";
import { BottomSheet } from "@/components/ds/cards/BottomSheet";
import { GlassButton } from "@/components/glass/GlassButton";
import { IconButton } from "@/components/ds/controls/IconButton";
import { FloatingButton } from "@/components/ds/controls/FloatingButton";
import { StatusBadge } from "@/components/ds/controls/StatusBadge";
import { PageTransition } from "@/components/ds/motion/PageTransition";
import { useDiscoveryStore } from "@/store/slices/discoveryStore";

export const Route = createFileRoute("/_app/rooms")({
  head: () => ({
    meta: [
      { title: "Räume · Smart Home" },
      { name: "description", content: "Alle Räume auf einen Blick." },
    ],
  }),
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [query, setQuery] = useState("");
  const discovering = useDiscoveryStore((s) => s.isScanning);

  const sortedRooms = useMemo(
    () =>
      [...rooms].sort((a, b) => {
        if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
        return a.order - b.order;
      }),
    [rooms],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sortedRooms;
    return sortedRooms.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.tags?.some((t) => t.toLowerCase().includes(q)),
    );
  }, [sortedRooms, query]);

  const handleCreate = (v: RoomFormValue) => {
    roomManager.create(v);
    setSheetOpen(false);
  };

  return (
    <PageTransition>
      <PageHeader
        title="Räume"
        subtitle={`${rooms.length} ${rooms.length === 1 ? "Raum" : "Räume"}`}
        trailing={
          <IconButton
            aria-label="Raum hinzufügen"
            variant="glass"
            onClick={() => setSheetOpen(true)}
          >
            <Plus className="h-5 w-5" />
          </IconButton>
        }
      />

      <HeroCard
        title="Zuhause"
        subtitle="Alle Räume und ihre Discovery"
        icon={<Home className="h-6 w-6" />}
        accent="#6366f1"
        actions={
          <StatusBadge tone={discovering ? "info" : "success"} icon={<Radar className="h-3 w-3" />}>
            {discovering ? "Sucht Geräte" : "Bereit"}
          </StatusBadge>
        }
      >
        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="Räume" value={rooms.length} />
          <MiniStat label="Favoriten" value={rooms.filter((r) => r.favorite).length} />
          <MiniStat label="Etagen" value={new Set(rooms.map((r) => r.floor).filter((f) => f !== undefined)).size} />
        </div>
      </HeroCard>

      {rooms.length > 0 && (
        <div className="mt-4 flex items-center gap-2">
          <div className="glass-panel hairline flex flex-1 items-center gap-2 !py-2 !px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Räume durchsuchen"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              aria-label="Räume durchsuchen"
            />
          </div>
        </div>
      )}

      <div className="mt-4">
        {rooms.length === 0 ? (
          <EmptyStateCard
            icon={Home}
            title="Noch keine Räume"
            description="Erstelle deinen ersten Raum, um dein Zuhause zu organisieren."
            action={
              <GlassButton variant="primary" onClick={() => setSheetOpen(true)}>
                <Plus className="h-4 w-4" /> Raum erstellen
              </GlassButton>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyStateCard
            icon={Search}
            title="Keine Treffer"
            description="Kein Raum passt zur aktuellen Suche."
          />
        ) : (
          <RoomList rooms={filtered} />
        )}
      </div>

      <FloatingButton
        aria-label="Raum erstellen"
        onClick={() => setSheetOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </FloatingButton>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Neuer Raum">
        <RoomForm onSubmit={handleCreate} onCancel={() => setSheetOpen(false)} submitLabel="Erstellen" />
      </BottomSheet>
    </PageTransition>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/25 px-3 py-2 backdrop-blur-sm">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
