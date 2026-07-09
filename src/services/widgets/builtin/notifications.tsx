import { widgetRegistry } from "@/services/widgets/WidgetRegistry";
import { defineWidget } from "@/models/widgetDescriptor";
import { Bell, AlertOctagon, AlertTriangle, Pin, Inbox } from "lucide-react";
import {
  useNotificationsStore,
  selectUnreadCount,
  selectCritical,
  selectWarnings,
  selectPinned,
  selectActive,
} from "@/store/slices/notificationsStore";
import type { AppNotification } from "@/models/notification";

const ALL_LAYOUTS = [
  "phone-portrait",
  "phone-landscape",
  "tablet-portrait",
  "tablet-landscape",
  "desktop",
] as const;

function dotClass(sev: AppNotification["severity"]): string {
  switch (sev) {
    case "success": return "bg-emerald-400";
    case "warning": return "bg-amber-400";
    case "error":
    case "critical": return "bg-red-500";
    default: return "bg-sky-400";
  }
}

function ListWidget({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: typeof Bell;
  items: AppNotification[];
}) {
  return (
    <div className="h-full overflow-hidden p-3" aria-live="polite">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4" /> {title}
      </div>
      {items.length === 0 ? (
        <div className="grid h-[calc(100%-1.5rem)] place-items-center text-[11px] text-muted-foreground">
          Keine Einträge
        </div>
      ) : (
        <ul className="space-y-1.5 overflow-y-auto text-xs">
          {items.slice(0, 8).map((n) => (
            <li key={n.id} className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${dotClass(n.severity)}`} aria-hidden />
              <span className="truncate">{n.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NotificationCenterWidget() {
  const items = useNotificationsStore(selectActive);
  return <ListWidget title="Ereignisse" icon={Inbox} items={items} />;
}

function UnreadCounterWidget() {
  const count = useNotificationsStore(selectUnreadCount);
  return (
    <div className="grid h-full place-items-center p-3">
      <div className="flex flex-col items-center gap-1">
        <Bell className="h-6 w-6 text-accent" />
        <div className="text-3xl font-semibold tabular-nums">{count}</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          ungelesen
        </div>
      </div>
    </div>
  );
}

function CriticalWidget() {
  const items = useNotificationsStore(selectCritical);
  return <ListWidget title="Kritisch" icon={AlertOctagon} items={items} />;
}

function WarningsWidget() {
  const items = useNotificationsStore(selectWarnings);
  return <ListWidget title="Warnungen" icon={AlertTriangle} items={items} />;
}

function RecentWidget() {
  const items = useNotificationsStore(selectActive);
  return <ListWidget title="Letzte Ereignisse" icon={Bell} items={items.slice(0, 8)} />;
}

function PinnedWidget() {
  const items = useNotificationsStore(selectPinned);
  return <ListWidget title="Angeheftet" icon={Pin} items={items} />;
}

const descriptors = [
  defineWidget({
    id: "notification.center",
    name: "Event Center",
    category: "system",
    description: "Kompakte Inbox der aktuellen Ereignisse.",
    icon: "inbox",
    defaultSize: { w: 4, h: 3 }, minSize: { w: 3, h: 2 }, maxSize: { w: 8, h: 6 },
    supportedLayouts: [...ALL_LAYOUTS],
    settings: [], capabilities: ["themeable", "movable", "resizable"], version: 1,
    render: () => <NotificationCenterWidget />,
  }),
  defineWidget({
    id: "notification.unread",
    name: "Ungelesen",
    category: "system",
    description: "Anzahl ungelesener Ereignisse.",
    icon: "bell",
    defaultSize: { w: 2, h: 2 }, minSize: { w: 2, h: 2 }, maxSize: { w: 4, h: 3 },
    supportedLayouts: [...ALL_LAYOUTS],
    settings: [], capabilities: ["themeable", "movable", "resizable"], version: 1,
    render: () => <UnreadCounterWidget />,
  }),
  defineWidget({
    id: "notification.critical",
    name: "Kritische Ereignisse",
    category: "system",
    description: "Fehler und kritische Meldungen.",
    icon: "alert-octagon",
    defaultSize: { w: 4, h: 3 }, minSize: { w: 3, h: 2 }, maxSize: { w: 8, h: 5 },
    supportedLayouts: [...ALL_LAYOUTS],
    settings: [], capabilities: ["themeable", "movable", "resizable"], version: 1,
    render: () => <CriticalWidget />,
  }),
  defineWidget({
    id: "notification.warnings",
    name: "Warnungen",
    category: "system",
    description: "Aktuelle Warnungen.",
    icon: "alert-triangle",
    defaultSize: { w: 4, h: 3 }, minSize: { w: 3, h: 2 }, maxSize: { w: 8, h: 5 },
    supportedLayouts: [...ALL_LAYOUTS],
    settings: [], capabilities: ["themeable", "movable", "resizable"], version: 1,
    render: () => <WarningsWidget />,
  }),
  defineWidget({
    id: "notification.recent",
    name: "Letzte Ereignisse",
    category: "system",
    description: "Die zuletzt eingegangenen Benachrichtigungen.",
    icon: "bell",
    defaultSize: { w: 4, h: 3 }, minSize: { w: 3, h: 2 }, maxSize: { w: 8, h: 6 },
    supportedLayouts: [...ALL_LAYOUTS],
    settings: [], capabilities: ["themeable", "movable", "resizable"], version: 1,
    render: () => <RecentWidget />,
  }),
  defineWidget({
    id: "notification.pinned",
    name: "Angeheftet",
    category: "system",
    description: "Angeheftete Benachrichtigungen.",
    icon: "pin",
    defaultSize: { w: 4, h: 3 }, minSize: { w: 3, h: 2 }, maxSize: { w: 8, h: 6 },
    supportedLayouts: [...ALL_LAYOUTS],
    settings: [], capabilities: ["themeable", "movable", "resizable"], version: 1,
    render: () => <PinnedWidget />,
  }),
];

let registered = false;
export function registerNotificationWidgets(): void {
  if (registered) return;
  registered = true;
  for (const d of descriptors) widgetRegistry.register(d);
}

export const NOTIFICATION_WIDGET_IDS = descriptors.map((d) => d.id);
