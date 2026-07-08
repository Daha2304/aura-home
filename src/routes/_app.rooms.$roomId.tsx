import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Heart, Home, Pencil, Trash2, Radar, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";
import { useRoomsStore } from "@/store/slices/roomsStore";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { useDiscoveryStore } from "@/store/slices/discoveryStore";
import { roomManager } from "@/services/rooms";
import { HeroCard } from "@/components/ds/cards/HeroCard";
import { MetricCard } from "@/components/ds/cards/MetricCard";
import { StatusCard } from "@/components/ds/cards/StatusCard";
import { SectionCard } from "@/components/ds/cards/SectionCard";
import { EmptyStateCard } from "@/components/ds/cards/EmptyStateCard";
import { InfoCard } from "@/components/ds/cards/InfoCard";
import { BottomSheet } from "@/components/ds/cards/BottomSheet";
import { DialogCard } from "@/components/ds/cards/DialogCard";
import { IconButton } from "@/components/ds/controls/IconButton";
import { StatusBadge } from "@/components/ds/controls/StatusBadge";
import { GlassButton } from "@/components/glass/GlassButton";
import { PageTransition } from "@/components/ds/motion/PageTransition";
import { RoomIcon } from "@/components/rooms/RoomIcon";
import { RoomForm, type RoomFormValue } from "@/components/rooms/RoomForm";
import { layoutIds } from "@/components/ds/motion/SharedLayout";
import { getRoomCategoryMeta } from "@/models/roomCategory";

export const Route = createFileRoute("/_app/rooms/$roomId")({
  component: RoomDetail,
  notFoundComponent: RoomNotFound,
});

function RoomDetail() {
  const { roomId } = Route.useParams();
  const navigate = useNavigate();
  const room = useRoomsStore((s) => s.byId[roomId]);
  const deviceCount = useDevicesStore(
    (s) => s.devices.filter((d) => d.roomId === roomId).length,
  );
  const onlineCount = useDevicesStore(
    (s) => s.devices.filter((d) => d.roomId === roomId && d.online).length,
  );
  const discovering = useDiscoveryStore((s) => s.state === "discovering");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!room) throw notFound();

  const meta = getRoomCategoryMeta(room.type);
  const offlineCount = deviceCount - onlineCount;

  const handleEdit = (v: RoomFormValue) => {
    roomManager.update(room.id, v);
    setEditOpen(false);
  };

  const handleDelete = () => {
    roomManager.delete(room.id);
    void navigate({ to: "/rooms" });
  };

  return (
    <PageTransition>
      <div className="mb-3">
        <Link
          to="/rooms"
          className="inline-flex items-center gap-1 text-sm text-accent hover:opacity-80"
        >
          <ChevronLeft className="h-4 w-4" /> Räume
        </Link>
      </div>

      <HeroCard
        layoutId={layoutIds.roomHero(room.id)}
        title={room.name}
        subtitle={room.description ?? meta.label}
        image={room.image}
        accent={room.color}
        icon={<RoomIcon type={room.type} className="h-6 w-6" />}
        actions={
          <div className="flex items-center gap-2">
            <IconButton
              aria-label={room.favorite ? "Favorit entfernen" : "Favorit setzen"}
              variant="glass"
              onClick={() => roomManager.toggleFavorite(room.id)}
            >
              <Heart
                className={`h-4 w-4 ${room.favorite ? "fill-red-500 text-red-500" : ""}`}
              />
            </IconButton>
            <IconButton
              aria-label="Raum bearbeiten"
              variant="glass"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-4 w-4" />
            </IconButton>
            <IconButton
              aria-label="Raum löschen"
              variant="glass"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </IconButton>
          </div>
        }
      >
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="accent">{meta.label}</StatusBadge>
          {room.floor !== undefined && (
            <StatusBadge tone="neutral">Etage {room.floor}</StatusBadge>
          )}
          {room.favorite && <StatusBadge tone="danger">Favorit</StatusBadge>}
          {room.tags?.map((t) => (
            <StatusBadge key={t} tone="info">
              #{t}
            </StatusBadge>
          ))}
        </div>
      </HeroCard>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Geräte" value={deviceCount} icon={<Home className="h-4 w-4" />} />
        <MetricCard label="Online" value={onlineCount} icon={<Wifi className="h-4 w-4" />} />
        <MetricCard label="Offline" value={offlineCount} icon={<WifiOff className="h-4 w-4" />} />
        <MetricCard label="Favoriten" value={room.favorite ? 1 : 0} icon={<Heart className="h-4 w-4" />} />
      </div>

      <div className="mt-4 grid gap-3">
        <StatusCard
          label="Discovery"
          value={discovering ? "Suche läuft" : "Bereit"}
          tone={discovering ? "info" : "success"}
          icon={<Radar className="h-4 w-4" />}
          hint="Neue Geräte werden automatisch zugeordnet."
        />
      </div>

      <SectionCard title="Geräte" description="Geräte-Liste folgt in Teil 6B/7.">
        <EmptyStateCard
          icon={Home}
          title="Noch keine Geräte in diesem Raum"
          description="Sobald Geräte gefunden werden, erscheinen sie hier."
        />
      </SectionCard>

      <div className="mt-4">
        <InfoCard title="Hinweis">
          Räume sind die Basis für die weitere Smart-Home-Integration. Steuerung,
          Automationen und Diagramme folgen in späteren Teilen.
        </InfoCard>
      </div>

      <BottomSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`${room.name} bearbeiten`}
      >
        <RoomForm
          initial={room}
          submitLabel="Speichern"
          onSubmit={handleEdit}
          onCancel={() => setEditOpen(false)}
        />
      </BottomSheet>

      <DialogCard
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Raum löschen?"
        description={`„${room.name}" wird dauerhaft entfernt.`}
        actions={
          <>
            <GlassButton variant="ghost" onClick={() => setDeleteOpen(false)}>
              Abbrechen
            </GlassButton>
            <GlassButton variant="danger" onClick={handleDelete}>
              Löschen
            </GlassButton>
          </>
        }
      />
    </PageTransition>
  );
}

function RoomNotFound() {
  return (
    <EmptyStateCard
      icon={Home}
      title="Raum nicht gefunden"
      description="Dieser Raum existiert nicht mehr."
      action={
        <Link to="/rooms">
          <GlassButton variant="primary">Zu allen Räumen</GlassButton>
        </Link>
      }
    />
  );
}
