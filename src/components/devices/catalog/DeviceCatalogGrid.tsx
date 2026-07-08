import { AnimatePresence, motion } from "framer-motion";
import type { Device } from "@/models/device";
import type { ViewMode } from "@/store/slices/deviceCatalogStore";
import { DeviceRenderer } from "@/components/devices/renderer/DeviceRenderer";
import { cn } from "@/lib/utils";

interface Props {
  devices: readonly Device[];
  view: ViewMode;
  onFavoriteToggle?: (id: string) => void;
  onOpenActions?: (id: string) => void;
}

/** Layout-Wrapper. Wählt das Grid ausschließlich anhand des ViewMode. */
export function DeviceCatalogGrid({
  devices,
  view,
  onFavoriteToggle,
  onOpenActions,
}: Props) {
  const gridClass =
    view === "list" || view === "compact"
      ? "grid grid-cols-1 gap-2"
      : view === "large"
        ? "grid grid-cols-1 gap-3 sm:grid-cols-2"
        : "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";
  return (
    <motion.div layout className={cn(gridClass)}>
      <AnimatePresence initial={false}>
        {devices.map((d) => (
          <DeviceRenderer
            key={d.id}
            device={d}
            view={view}
            onFavoriteToggle={onFavoriteToggle}
            onOpenActions={onOpenActions}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
