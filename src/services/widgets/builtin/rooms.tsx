import { widgetRegistry } from "@/services/widgets/WidgetRegistry";
import { defineWidget, type WidgetDescriptor } from "@/models/widgetDescriptor";
import { useRoomsStore } from "@/store/slices/roomsStore";
import { RoomIcon } from "@/components/rooms/RoomIcon";
import { Home } from "lucide-react";

function RoomOverviewWidget() {
  const rooms = useRoomsStore((s) => s.rooms);
  const favorites = rooms.filter((r) => r.favorite).length;
  return (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Home className="h-4 w-4" />
        Räume
      </div>
      <div>
        <div className="text-3xl font-semibold">{rooms.length}</div>
        <div className="text-xs text-muted-foreground">
          {favorites > 0 ? `${favorites} Favoriten` : "Übersicht"}
        </div>
      </div>
    </div>
  );
}

function RoomHeroWidget({ roomId }: { roomId?: string }) {
  const room = useRoomsStore((s) => (roomId ? s.byId[roomId] : undefined));
  if (!room) {
    return (
      <div className="grid h-full place-items-center p-4 text-sm text-muted-foreground">
        Kein Raum ausgewählt
      </div>
    );
  }
  return (
    <div
      className="relative flex h-full flex-col justify-end p-4"
      style={{ "--accent": room.color } as React.CSSProperties}
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-50"
        style={{
          background:
            "radial-gradient(120% 100% at 0% 0%, color-mix(in oklab, var(--accent) 55%, transparent), transparent 65%)",
        }}
      />
      <div className="mb-2 inline-grid h-10 w-10 place-items-center rounded-2xl bg-white/25">
        <RoomIcon type={room.type} className="h-5 w-5" />
      </div>
      <div className="text-lg font-semibold">{room.name}</div>
      <div className="text-xs text-muted-foreground">Raum</div>
    </div>
  );
}

function RoomStatusWidget() {
  const total = useRoomsStore((s) => s.rooms.length);
  return (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        Raumstatus
      </div>
      <div>
        <div className="text-2xl font-semibold">{total} aktiv</div>
        <div className="text-xs text-muted-foreground">Alle Räume online</div>
      </div>
    </div>
  );
}

function RoomSummaryWidget() {
  const rooms = useRoomsStore((s) => s.rooms);
  return (
    <div className="flex h-full flex-col gap-2 p-4">
      <div className="text-sm font-semibold">Zusammenfassung</div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-foreground/5 p-2">
          <div className="text-xs text-muted-foreground">Räume</div>
          <div className="text-lg font-semibold">{rooms.length}</div>
        </div>
        <div className="rounded-xl bg-foreground/5 p-2">
          <div className="text-xs text-muted-foreground">Favoriten</div>
          <div className="text-lg font-semibold">
            {rooms.filter((r) => r.favorite).length}
          </div>
        </div>
      </div>
    </div>
  );
}

const descriptors: WidgetDescriptor[] = [
  defineWidget({
    id: "room.overview",
    name: "Raumübersicht",
    category: "rooms",
    description: "Anzahl Räume und Favoriten.",
    icon: "home",
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 6, h: 3 },
    supportedLayouts: [
      "phone-portrait",
      "phone-landscape",
      "tablet-portrait",
      "tablet-landscape",
      "desktop",
    ],
    settings: [],
    capabilities: ["themeable", "movable", "resizable"],
    version: 1,
    render: () => <RoomOverviewWidget />,
  }),
  defineWidget({
    id: "room.hero",
    name: "Raum Hero",
    category: "rooms",
    description: "Hero-Karte für einen einzelnen Raum.",
    icon: "layout",
    defaultSize: { w: 6, h: 3 },
    minSize: { w: 4, h: 2 },
    maxSize: { w: 12, h: 5 },
    supportedLayouts: [
      "phone-portrait",
      "phone-landscape",
      "tablet-portrait",
      "tablet-landscape",
      "desktop",
    ],
    settings: [{ key: "roomId", label: "Raum", type: "room" }],
    capabilities: ["themeable", "movable", "resizable", "configurable"],
    version: 1,
    render: ({ instance }) => (
      <RoomHeroWidget roomId={instance.config?.roomId as string | undefined} />
    ),
  }),
  defineWidget({
    id: "room.status",
    name: "Raumstatus",
    category: "rooms",
    description: "Aktivstatus aller Räume.",
    icon: "activity",
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 6, h: 3 },
    supportedLayouts: [
      "phone-portrait",
      "phone-landscape",
      "tablet-portrait",
      "tablet-landscape",
      "desktop",
    ],
    settings: [],
    capabilities: ["themeable", "movable", "resizable"],
    version: 1,
    render: () => <RoomStatusWidget />,
  }),
  defineWidget({
    id: "room.summary",
    name: "Raum-Zusammenfassung",
    category: "rooms",
    description: "Kurze Kennzahlen zu Räumen.",
    icon: "list",
    defaultSize: { w: 4, h: 2 },
    minSize: { w: 3, h: 2 },
    maxSize: { w: 8, h: 3 },
    supportedLayouts: [
      "phone-portrait",
      "phone-landscape",
      "tablet-portrait",
      "tablet-landscape",
      "desktop",
    ],
    settings: [],
    capabilities: ["themeable", "movable", "resizable"],
    version: 1,
    render: () => <RoomSummaryWidget />,
  }),
];

let registered = false;
export function registerRoomWidgets(): void {
  if (registered) return;
  registered = true;
  for (const d of descriptors) widgetRegistry.register(d);
}

export const ROOM_WIDGET_IDS = descriptors.map((d) => d.id);
