import type { Device } from "@/models/device";
import type { ViewMode } from "@/store/slices/deviceCatalogStore";
import { DeviceCardLarge } from "@/components/devices/cards/DeviceCardLarge";
import { DeviceCardCompact } from "@/components/devices/cards/DeviceCardCompact";
import { DeviceCardList } from "@/components/devices/cards/DeviceCardList";

export interface DeviceRendererProps {
  device: Device;
  view: ViewMode;
  onFavoriteToggle?: (id: string) => void;
  onOpenActions?: (id: string) => void;
}

/**
 * Renderer-Factory. Wählt die Card-Variante ausschließlich anhand
 * des View-Mode — die konkrete Präsentation (Farbe, Icon) kommt aus
 * der Device-Presentation-Registry.
 */
export function DeviceRenderer(props: DeviceRendererProps) {
  const { view, ...rest } = props;
  switch (view) {
    case "list":
      return <DeviceCardList {...rest} />;
    case "compact":
      return <DeviceCardCompact {...rest} />;
    case "large":
    case "grid":
    default:
      return <DeviceCardLarge {...rest} />;
  }
}
