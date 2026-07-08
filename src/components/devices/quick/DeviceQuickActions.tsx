import { useNavigate } from "@tanstack/react-router";
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

export function DeviceQuickActions({ device, onClose }: Props) {
  const navigate = useNavigate();
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
  const openDetails = () => {
    void navigate({ to: "/devices/$deviceId", params: { deviceId: device.id } });
    onClose();
  };
  return (
    <BottomSheet open={!!device} onClose={onClose} title={device.name}>
      <div className="flex flex-col gap-2">
        <GlassListItem
          onClick={openDetails}
          leading={<Eye className="h-4 w-4" />}
          title="Details öffnen"
          description="Alle Informationen zum Gerät"
          showChevron
        />
        <GlassListItem
          onClick={toggleFavorite}
          leading={<Heart className="h-4 w-4" />}
          title={device.favorite ? "Favorit entfernen" : "Als Favorit"}
        />
        <GlassListItem
          onClick={clearRoom}
          leading={<MapPin className="h-4 w-4" />}
          title="Raumzuweisung entfernen"
          description={device.roomId ? "Gerät ist aktuell einem Raum zugewiesen" : "Gerät ist ohne Raum"}
        />

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
