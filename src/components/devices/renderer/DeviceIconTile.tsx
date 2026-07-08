import type { Device } from "@/models/device";
import { DeviceIcon } from "@/components/devices/DeviceIcon";
import { devicePresentationRegistry } from "@/services/devices/presentation";
import { cn } from "@/lib/utils";

/**
 * Rendert das Geräteicon in einer präsentativen Kachel. Farbe stammt
 * ausschließlich aus dem Presenter (via Registry) — keine if/else.
 */
export function DeviceIconTile({
  device,
  size = "md",
  className,
}: {
  device: Device;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const presenter = devicePresentationRegistry.resolve(device);
  const dim = size === "lg" ? "h-14 w-14" : size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const iconDim = size === "lg" ? "h-6 w-6" : size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-2xl bg-[color:var(--device-accent)]/15 text-[color:var(--device-accent)]",
        dim,
        className,
      )}
      style={{ ["--device-accent" as string]: presenter.accent }}
    >
      <DeviceIcon type={device.type} className={iconDim} />
    </div>
  );
}
