import type { WidgetInstance } from "@/models/widgetInstance";
import { useWidgetRegistryStore } from "@/store/slices/widgetRegistryStore";
import { PlaceholderTile } from "./PlaceholderTile";

interface Props {
  widget: WidgetInstance;
}

/**
 * Löst den passenden Descriptor über die Registry auf und rendert. In dieser
 * Phase liefern Descriptors keine eigenen Renderer — daher zeigt der Renderer
 * die PlaceholderTile.
 */
export function WidgetRenderer({ widget }: Props) {
  const descriptor = useWidgetRegistryStore((s) => s.byId[widget.widgetType]);
  return <PlaceholderTile widget={widget} descriptor={descriptor} />;
}
