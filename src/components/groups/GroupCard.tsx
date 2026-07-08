import { memo, useMemo } from "react";
import { Layers } from "lucide-react";
import type { DeviceGroup } from "@/models/deviceGroup";
import { GlassCard } from "@/components/glass/GlassCard";
import { groupResolver } from "@/services/groups";
import { useGroupsStore } from "@/store/slices/groupsStore";

interface Props {
  group: DeviceGroup;
  onOpen?: (id: string) => void;
}

export const GroupCard = memo(function GroupCard({ group, onOpen }: Props) {
  // Recompute when store revision changes.
  const revision = useGroupsStore((s) => s.revision);
  const expanded = useMemo(() => {
    void revision;
    return groupResolver.expand(group.id);
  }, [group.id, revision]);

  return (
    <GlassCard
      interactive
      accent={group.color}
      onClick={() => onOpen?.(group.id)}
      className="flex items-center gap-3"
    >
      <div
        className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-accent"
        style={{ background: group.color ?? "oklch(0.75 0.14 200 / 0.2)" }}
      >
        <Layers className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold">{group.name}</div>
        <div className="text-xs text-muted-foreground">
          {expanded.length} Gerät{expanded.length === 1 ? "" : "e"}
          {group.groupIds.length > 0 ? ` · ${group.groupIds.length} Untergruppen` : ""}
          {" · "}
          {group.kind}
        </div>
      </div>
    </GlassCard>
  );
});
