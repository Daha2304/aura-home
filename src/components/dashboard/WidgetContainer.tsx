import type { WidgetType } from "@/models/widget";
import { FavoritesWidget } from "./widgets/FavoritesWidget";
import { QuickActionsWidget } from "./widgets/QuickActionsWidget";
import { StatusWidget } from "./widgets/StatusWidget";
import { RoomsWidget } from "./widgets/RoomsWidget";
import { ScenesWidget } from "./widgets/ScenesWidget";
import { EnergyWidget } from "./widgets/EnergyWidget";
import { ClimateWidget } from "./widgets/ClimateWidget";
import { SecurityWidget } from "./widgets/SecurityWidget";

const registry: Record<WidgetType, React.ComponentType> = {
  favorites: FavoritesWidget,
  quickActions: QuickActionsWidget,
  status: StatusWidget,
  rooms: RoomsWidget,
  scenes: ScenesWidget,
  energy: EnergyWidget,
  climate: ClimateWidget,
  security: SecurityWidget,
};

export function WidgetContainer({ type }: { type: WidgetType }) {
  const Comp = registry[type];
  if (!Comp) return null;
  return <Comp />;
}
