import { Link } from "@tanstack/react-router";
import { Heart, Info, MapPin, Tag, Eye } from "lucide-react";
import type { Device } from "@/models/device";
import { BottomSheet } from "@/components/ds/cards/BottomSheet";
import { GlassListItem } from "@/components/ds/controls/GlassListItem";
import { deviceAssignmentEngine } from "@/services/intelligence";
import { useDevicesStore } from "@/store/slices/devicesStore";

interface Props {
  device: Device | null;
  onClose: () => void;
}

/**
 * Quick-Actions BottomSheet. Enthält KEINE Gerätesteuerung — nur
 * Navigations- und Metadaten-Aktionen.
 */
export function DeviceQuickActions({ device, onClose }: Props) {
  if (!device) return null;
  const store = useDevicesStore.getState();
  const toggleFavorite = () => {
    store.upsertDevice({ ...device, favorite: !device.favorite });
    onClose();
  };
  const clearRoom = () => {
    deviceAssignmentEngine.assign(device.id, { roomId: null });
    onClose();
  };
  return (
    <BottomSheet open={!!device} onClose={onClose} title={device.name}>
      <div className="flex flex-col gap-2">
        <Link to="/devices/$deviceId" params={{ deviceId: device.id }}>
          <GlassListItem
            leading={<Eye className="h-4 w-4" />}
            title="Details öffnen"
            description="Alle Informationen zum Gerät"
          />
        </Link>
        <button type="button" onClick={toggleFavorite} className="text-left">
          <GlassListItem
            leading={<Heart className="h-4 w-4" />}
            title={device.favorite ? "Favorit entfernen" : "Als Favorit"}
          />
        </button>
        <button type="button" onClick={clearRoom} className="text-left">
          <GlassListItem
            leading={<MapPin className="h-4 w-4" />}
            title="Raumzuweisung entfernen"
            description={device.roomId ? "Gerät ist aktuell einem Raum zugewiesen" : "Gerät ist ohne Raum"}
          />
        </button>
        <GlassListItem
          leading={<Tag className="h-4 w-4" />}
          title="Tags"
          description={device.tags?.join(", ") || "Keine Tags"}
        />
        <GlassListItem
          leading={<Info className="h-4 w-4" />}
          title="Informationen"
          description={[device.manufacturer, device.model].filter(Boolean).join(" · ") || "—"}
        />
      </div>
    </BottomSheet>
  );
}
