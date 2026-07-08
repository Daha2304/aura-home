import { cn } from "@/lib/utils";

export function DeviceStatusBadge({ online }: { online: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
        online
          ? "bg-success/15 text-success"
          : "bg-muted text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          online ? "bg-success" : "bg-muted-foreground/50",
        )}
      />
      {online ? "Online" : "Offline"}
    </span>
  );
}
