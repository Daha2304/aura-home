import { Cloud, Star } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import type { ServerConfig } from "@/models/server";
import { buildServerUrl } from "@/models/server";
import { cn } from "@/lib/utils";

interface ServerCardProps {
  server: ServerConfig;
  active?: boolean;
  status?: "online" | "offline" | "unknown";
  onClick?: () => void;
  trailing?: React.ReactNode;
}

export function ServerCard({
  server,
  active,
  status = "unknown",
  onClick,
  trailing,
}: ServerCardProps) {
  return (
    <GlassCard
      interactive={!!onClick}
      onClick={onClick}
      accent={server.color}
      className={cn(
        "flex items-center gap-3",
        active && "ring-1 ring-primary/50",
      )}
    >
      <div
        className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-primary"
        style={{
          background: server.color
            ? `color-mix(in oklab, ${server.color} 25%, transparent)`
            : "color-mix(in oklab, var(--primary) 20%, transparent)",
        }}
      >
        <Cloud className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[15px] font-semibold">{server.name}</span>
          {server.favorite && (
            <Star className="h-3.5 w-3.5 shrink-0 fill-warning text-warning" />
          )}
        </div>
        <div className="truncate font-mono text-[11px] text-muted-foreground">
          {buildServerUrl(server)}
        </div>
        {server.lastConnectedAt && (
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            Zuletzt verbunden {formatRelative(server.lastConnectedAt)}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusDot status={status} active={active} />
        {trailing}
      </div>
    </GlassCard>
  );
}

function StatusDot({
  status,
  active,
}: {
  status: "online" | "offline" | "unknown";
  active?: boolean;
}) {
  if (active && status === "online")
    return (
      <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
        Aktiv
      </span>
    );
  if (active)
    return (
      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
        Aktiv
      </span>
    );
  const cls =
    status === "online"
      ? "bg-success"
      : status === "offline"
        ? "bg-muted-foreground"
        : "bg-white/20";
  return <span className={cn("h-2 w-2 rounded-full", cls)} aria-hidden />;
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `vor ${h} h`;
  const d = Math.floor(h / 24);
  return `vor ${d} d`;
}
