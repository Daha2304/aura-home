import { EmptyStateCard } from "@/components/ds/cards/EmptyStateCard";
import { SkeletonCard } from "@/components/ds/cards/SkeletonCard";
import { Radar, WifiOff, ServerOff, PackageSearch, SearchX } from "lucide-react";

export type EmptyKind = "no-devices" | "discovering" | "server-offline" | "no-connection" | "no-results";

export function DeviceCatalogEmpty({ kind }: { kind: EmptyKind }) {
  switch (kind) {
    case "discovering":
      return (
        <EmptyStateCard
          icon={Radar}
          title="Discovery läuft"
          description="Geräte werden erkannt und synchronisiert. Das kann einige Sekunden dauern."
        />
      );
    case "server-offline":
      return (
        <EmptyStateCard
          icon={ServerOff}
          title="Server offline"
          description="Der aktive Smart-Home-Server ist nicht erreichbar."
        />
      );
    case "no-connection":
      return (
        <EmptyStateCard
          icon={WifiOff}
          title="Keine Verbindung"
          description="Es besteht aktuell keine aktive Verbindung."
        />
      );
    case "no-results":
      return (
        <EmptyStateCard
          icon={SearchX}
          title="Keine Ergebnisse"
          description="Deine Filter oder Suche liefern keine Geräte."
        />
      );
    case "no-devices":
    default:
      return (
        <EmptyStateCard
          icon={PackageSearch}
          title="Keine Geräte"
          description="Sobald Geräte erkannt werden, erscheinen sie hier automatisch."
        />
      );
  }
}

export function DeviceCatalogSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={2} />
      ))}
    </div>
  );
}
