import { memo } from "react";
import { Heart } from "lucide-react";
import type { DevicePanelDescriptor, DevicePanelProps } from "@/models/devicePanel";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { useRoomsStore } from "@/store/slices/roomsStore";
import { deviceRegistry } from "@/services/registry/DeviceRegistry";
import { devicePresentationRegistry } from "@/services/devices/presentation";
import { HeroCard } from "@/components/ds/cards/HeroCard";
import { IconButton } from "@/components/ds/controls/IconButton";
import { StatusBadge } from "@/components/ds/controls/StatusBadge";
import { DeviceIcon } from "@/components/devices/DeviceIcon";
import { DeviceStatusChips } from "@/components/devices/renderer/DeviceStatusChips";

const HeroPanelComponent = memo(function HeroPanel({ device }: DevicePanelProps) {
  const room = useRoomsStore((s) =>
    device.roomId ? s.byId[device.roomId] : undefined,
  );
  const desc = deviceRegistry.get(device.type);
  const presenter = devicePresentationRegistry.resolve(device);

  const toggleFavorite = () =>
    useDevicesStore
      .getState()
      .upsertDevice({ ...device, favorite: !device.favorite });

  return (
    <HeroCard
      title={device.name}
      subtitle={room?.name ?? desc?.name ?? device.type}
      accent={presenter.accent}
      icon={<DeviceIcon type={device.type} className="h-6 w-6" />}
      actions={
        <IconButton
          aria-label={device.favorite ? "Favorit entfernen" : "Als Favorit"}
          onClick={toggleFavorite}
        >
          <Heart
            className={
              device.favorite
                ? "h-4 w-4 fill-current text-destructive"
                : "h-4 w-4"
            }
          />
        </IconButton>
      }
    >
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <StatusBadge tone={device.online ? "success" : "neutral"}>
          {device.online ? "Online" : "Offline"}
        </StatusBadge>
        <DeviceStatusChips device={device} />
        {device.tags?.map((t) => (
          <StatusBadge key={t} tone="accent">
            {t}
          </StatusBadge>
        ))}
      </div>
    </HeroCard>
  );
});

export const heroPanelDescriptor: DevicePanelDescriptor = {
  id: "hero",
  group: "hero",
  priority: 1000,
  isVisible: () => true,
  component: HeroPanelComponent,
};
