import { Star } from "lucide-react";
import { GlassCard } from "@/components/glass/GlassCard";
import { useDashboardStore } from "@/store/slices/dashboardStore";
import { useDevicesStore } from "@/store/slices/devicesStore";
import { DeviceCard } from "@/components/devices/DeviceCard";
import { SectionTitle } from "@/components/common/SectionTitle";

export function FavoritesWidget() {
  const favIds = useDashboardStore((s) => s.favoriteDeviceIds);
  const devices = useDevicesStore((s) =>
    s.devices.filter((d) => favIds.includes(d.id)),
  );
  return (
    <section className="space-y-2">
      <SectionTitle>Favoriten</SectionTitle>
      {devices.length === 0 ? (
        <GlassCard className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
          <Star className="h-5 w-5" />
          Markiere Geräte als Favorit, um sie hier zu sehen.
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {devices.map((d) => (
            <DeviceCard key={d.id} device={d} />
          ))}
        </div>
      )}
    </section>
  );
}
