import { ArrowUpDown, LayoutGrid, List, Rows, Grid3x3 } from "lucide-react";
import { SegmentedControl } from "@/components/ds/controls/SegmentedControl";
import { IconButton } from "@/components/ds/controls/IconButton";
import type { ViewMode } from "@/store/slices/deviceCatalogStore";
import type { GroupKey } from "@/services/devices/catalog/groupStrategies";
import { listGroupStrategies } from "@/services/devices/catalog/groupStrategies";
import { listSortStrategies, type SortDirection, type SortKey } from "@/services/devices/catalog/sortStrategies";

interface Props {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  group: GroupKey;
  onGroupChange: (g: GroupKey) => void;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSortChange: (k: SortKey) => void;
  onSortDirectionToggle: () => void;
  onOpenFilters: () => void;
  filterCount: number;
}

export function DeviceCatalogToolbar({
  view,
  onViewChange,
  group,
  onGroupChange,
  sortKey,
  sortDirection,
  onSortChange,
  onSortDirectionToggle,
  onOpenFilters,
  filterCount,
}: Props) {
  const viewOptions = [
    { value: "grid" as ViewMode, label: "Grid" },
    { value: "large" as ViewMode, label: "Groß" },
    { value: "list" as ViewMode, label: "Liste" },
    { value: "compact" as ViewMode, label: "Kompakt" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentedControl aria-label="Ansicht" value={view} onChange={onViewChange} options={viewOptions} />
      <select
        value={group}
        onChange={(e) => onGroupChange(e.target.value as GroupKey)}
        aria-label="Gruppierung"
        className="glass-panel hairline min-h-9 rounded-full bg-transparent px-3 text-sm"
      >
        {listGroupStrategies().map((s) => (
          <option key={s.key} value={s.key}>
            Gruppe: {s.label}
          </option>
        ))}
      </select>
      <select
        value={sortKey}
        onChange={(e) => onSortChange(e.target.value as SortKey)}
        aria-label="Sortierung"
        className="glass-panel hairline min-h-9 rounded-full bg-transparent px-3 text-sm"
      >
        {listSortStrategies().map((s) => (
          <option key={s.key} value={s.key}>
            Sortieren: {s.label}
          </option>
        ))}
      </select>
      <IconButton
        aria-label={sortDirection === "asc" ? "Absteigend sortieren" : "Aufsteigend sortieren"}
        onClick={onSortDirectionToggle}
      >
        <ArrowUpDown className="h-4 w-4" />
      </IconButton>
      <button
        type="button"
        onClick={onOpenFilters}
        className="glass-panel hairline inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm hover:bg-foreground/5"
      >
        <Grid3x3 className="h-4 w-4" />
        Filter
        {filterCount > 0 && (
          <span className="ml-1 rounded-full bg-primary px-1.5 py-px text-[10px] font-semibold text-primary-foreground">
            {filterCount}
          </span>
        )}
      </button>
    </div>
  );
}

// Kleine hilfreiche Icons re-export (nicht öffentlich):
export const __icons = { LayoutGrid, List, Rows };
