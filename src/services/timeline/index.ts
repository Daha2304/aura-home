import { timelineSourceRegistry } from "./TimelineSourceRegistry";
import { severityRegistry } from "./SeverityRegistry";
import { eventCategoryRegistry } from "./EventCategoryRegistry";
import { statisticsRegistry } from "./StatisticsRegistry";
import { energyRegistry } from "./EnergyRegistry";
import { BUILTIN_TIMELINE_SOURCES } from "./sources";
import { useTimelineStore } from "@/store/slices/timelineStore";
import { registerBuiltinChartTypes } from "@/services/charts/ChartRegistry";
import type { TimelineSourceDescriptor, TimelineEntry } from "@/models/timeline";
import { createLogger } from "@/services/logger/Logger";

export {
  timelineSourceRegistry,
  severityRegistry,
  eventCategoryRegistry,
  statisticsRegistry,
  energyRegistry,
};

const log = createLogger("timeline");
let bootstrapped = false;
let unsubs: Array<() => void> = [];

/**
 * Verbindet eine registrierte Quelle mit dem TimelineStore. Wird beim
 * Bootstrap für alle bekannten Descriptors aufgerufen und ebenfalls für
 * später registrierte Descriptors (siehe {@link watchNewSources}).
 */
function attachSource(desc: TimelineSourceDescriptor): () => void {
  if (desc.enabled === false) return () => {};
  // Historie initial spiegeln.
  const initial = desc.list?.();
  if (initial && initial.length) {
    useTimelineStore.getState().pushMany(
      initial.map((e) => normalize(e, desc)),
    );
  }
  const off = desc.subscribe((entry) => {
    useTimelineStore.getState().push(normalize(entry, desc));
  });
  return off;
}

function normalize(
  entry: TimelineEntry,
  desc: TimelineSourceDescriptor,
): TimelineEntry {
  return {
    ...entry,
    category: entry.category ?? desc.category,
    severity: entry.severity ?? desc.defaultSeverity,
    sourceVersion: entry.sourceVersion ?? desc.sourceVersion,
    icon: entry.icon ?? desc.icon,
  };
}

function watchNewSources(): () => void {
  return timelineSourceRegistry.events.on("registered", ({ descriptor }) => {
    const off = attachSource(descriptor);
    unsubs.push(off);
  });
}

export function bootstrapTimeline(): void {
  if (bootstrapped) return;
  bootstrapped = true;
  registerBuiltinChartTypes();

  for (const desc of BUILTIN_TIMELINE_SOURCES) {
    timelineSourceRegistry.register(desc);
  }
  for (const desc of timelineSourceRegistry.list()) {
    unsubs.push(attachSource(desc));
  }
  unsubs.push(watchNewSources());

  log.info(
    "timeline started, sources:",
    timelineSourceRegistry.list().map((s) => s.id).join(", "),
  );
}

export function stopTimeline(): void {
  if (!bootstrapped) return;
  for (const off of unsubs) off();
  unsubs = [];
  bootstrapped = false;
}
