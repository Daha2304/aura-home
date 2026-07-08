import { useMemo, useState } from "react";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { useRoomsStore } from "@/store/slices/roomsStore";
import { useDiscoveryStore } from "@/store/slices/discoveryStore";
import { useConnectionStore } from "@/store/slices/connectionStore";
import { useDeviceCatalogStore } from "@/store/slices/deviceCatalogStore";
import { deviceFilterEngine } from "@/services/intelligence";
import { sortDevices } from "@/services/devices/catalog/sortStrategies";
import { groupDevices } from "@/services/devices/catalog/groupStrategies";
import { SectionCard } from "@/components/ds/cards/SectionCard";
import { SharedLayout } from "@/components/ds/motion/SharedLayout";
import { DeviceCatalogSearch } from "./DeviceCatalogSearch";
import { DeviceCatalogToolbar } from "./DeviceCatalogToolbar";
import { DeviceCatalogFilters } from "./DeviceCatalogFilters";
import { DeviceCatalogGrid } from "./DeviceCatalogGrid";
import { DeviceCatalogEmpty, DeviceCatalogSkeleton } from "./DeviceCatalogStates";
import { DeviceQuickActions } from "@/components/devices/quick/DeviceQuickActions";
import type { Device } from "@/models/device";
import type { DeviceFilterCriteria } from "@/services/intelligence";

interface Props {
  /** Optional: nur Geräte dieses Raumes zeigen (Raumseiten). */
  roomId?: string;
}

/**
 * Zentrale Katalog-Ansicht. Rein Präsentation — alle Daten stammen aus
 * Discovery/Intelligence, alle Manipulationen laufen durch die Registry-
 * bzw. Intelligence-Services.
 */
export function DeviceCatalog({ roomId }: Props) {
  const allDevices = useDevicesStore((s) => s.devices);
  const rooms = useRoomsStore((s) => s.rooms);
  const roomIndex = useRoomsStore((s) => s.byId);
  const discoveryState = useDiscoveryStore((s) => s.state);
  const connectionStatus = useConnectionStore((s) => s.status);

  const view = useDeviceCatalogStore((s) => s.view);
  const setView = useDeviceCatalogStore((s) => s.setView);
  const group = useDeviceCatalogStore((s) => s.group);
  const setGroup = useDeviceCatalogStore((s) => s.setGroup);
  const sortKey = useDeviceCatalogStore((s) => s.sortKey);
  const sortDirection = useDeviceCatalogStore((s) => s.sortDirection);
  const setSort = useDeviceCatalogStore((s) => s.setSort);
  const toggleSortDirection = useDeviceCatalogStore((s) => s.toggleSortDirection);
  const criteria = useDeviceCatalogStore((s) => s.criteria);
  const setCriteria = useDeviceCatalogStore((s) => s.setCriteria);
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [quickDeviceId, setQuickDeviceId] = useState<string | null>(null);

  // Basis-Set (Raum-Filter für Raumseiten)
  const baseDevices = useMemo(
    () => (roomId ? allDevices.filter((d) => d.roomId === roomId) : allDevices),
    [allDevices, roomId],
  );

  // Filterkriterien inkl. Text
  const activeCriteria: DeviceFilterCriteria = useMemo(
    () => ({ ...criteria, ...(query ? { text: query } : {}) }),
    [criteria, query],
  );

  const filtered = useMemo(() => {
    const base = deviceFilterEngine.apply(baseDevices, activeCriteria);
    const manufacturer = (activeCriteria as { manufacturer?: string }).manufacturer;
    return manufacturer ? base.filter((d) => d.manufacturer === manufacturer) : base;
  }, [baseDevices, activeCriteria]);

  const sorted = useMemo(
    () => sortDevices(filtered, sortKey, sortDirection),
    [filtered, sortKey, sortDirection],
  );

  const groupsResolved = useMemo(() => {
    const map = new Map(rooms.map((r) => [r.id, r]));
    return groupDevices(sorted, group, { rooms: map });
  }, [sorted, group, rooms]);

  const manufacturers = useMemo(
    () =>
      Array.from(
        new Set(baseDevices.map((d) => d.manufacturer).filter((m): m is string => !!m)),
      ).sort(),
    [baseDevices],
  );
  const tags = useMemo(
    () =>
      Array.from(
        new Set(baseDevices.flatMap((d) => d.tags ?? [])),
      ).sort(),
    [baseDevices],
  );

  const filterCount =
    Object.keys(criteria).filter((k) => criteria[k as keyof DeviceFilterCriteria] !== undefined)
      .length;

  const empty: React.ReactNode = renderEmpty(
    baseDevices,
    sorted,
    discoveryState,
    connectionStatus,
  );

  const quickDevice: Device | null =
    quickDeviceId ? allDevices.find((d) => d.id === quickDeviceId) ?? null : null;

  return (
    <SharedLayout id="device-catalog">
      <div className="flex flex-col gap-3">
        <DeviceCatalogSearch value={query} onChange={setQuery} />
        <DeviceCatalogToolbar
          view={view}
          onViewChange={setView}
          group={group}
          onGroupChange={setGroup}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSortChange={(k) => setSort(k)}
          onSortDirectionToggle={toggleSortDirection}
          onOpenFilters={() => setFiltersOpen(true)}
          filterCount={filterCount}
        />

        {empty ??
          (group === "none" ? (
            <DeviceCatalogGrid
              devices={sorted}
              view={view}
              onOpenActions={(id) => setQuickDeviceId(id)}
              onFavoriteToggle={(id) => {
                const dev = allDevices.find((d) => d.id === id);
                if (dev) useDevicesStore.getState().upsertDevice({ ...dev, favorite: !dev.favorite });
              }}
            />
          ) : (
            <div className="flex flex-col gap-4">
              {groupsResolved.map((g) => (
                <SectionCard key={g.id} title={`${g.label} · ${g.devices.length}`} bare>
                  <DeviceCatalogGrid
                    devices={g.devices}
                    view={view}
                    onOpenActions={(id) => setQuickDeviceId(id)}
                    onFavoriteToggle={(id) => {
                      const dev = allDevices.find((d) => d.id === id);
                      if (dev) useDevicesStore.getState().upsertDevice({ ...dev, favorite: !dev.favorite });
                    }}
                  />
                </SectionCard>
              ))}
            </div>
          ))}
      </div>

      <DeviceCatalogFilters
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        criteria={criteria}
        onChange={setCriteria}
        manufacturers={manufacturers}
        tags={tags}
      />
      <DeviceQuickActions device={quickDevice} onClose={() => setQuickDeviceId(null)} />

      {/* Placeholder unter Fokus für roomId */}
      {roomId ? null : null}
    </SharedLayout>
  );

  function renderEmpty(
    base: Device[],
    result: Device[],
    ds: string,
    conn: string,
  ): React.ReactNode {
    if (conn === "idle" || conn === "disconnected" || conn === "error") {
      return <DeviceCatalogEmpty kind="no-connection" />;
    }
    if (base.length === 0) {
      if (ds === "discovering" || ds === "syncing") return <DeviceCatalogSkeleton />;
      return <DeviceCatalogEmpty kind="no-devices" />;
    }
    if (result.length === 0) return <DeviceCatalogEmpty kind="no-results" />;
    return null;
  }
}
