import { GlassCard } from "@/components/glass/GlassCard";
import { SectionTitle } from "@/components/common/SectionTitle";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { useConnectionStore } from "@/store/slices/connectionStore";
import { Cpu, Wifi, WifiOff } from "lucide-react";

export function StatusWidget() {
  const total = useDevicesStore((s) => s.devices.length);
  const online = useDevicesStore(
    (s) => s.devices.filter((d) => d.online).length,
  );
  const status = useConnectionStore((s) => s.status);
  const connected = status === "connected";

  return (
    <section className="space-y-2">
      <SectionTitle>Status</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Cpu className="h-4 w-4" /> Geräte
          </div>
          <div className="text-2xl font-bold tracking-tight">
            {online}
            <span className="text-base text-muted-foreground">/{total}</span>
          </div>
          <div className="text-xs text-muted-foreground">online</div>
        </GlassCard>
        <GlassCard className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {connected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            Verbindung
          </div>
          <div className="text-2xl font-bold tracking-tight capitalize">
            {status === "idle" ? "nicht verbunden" : status}
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
