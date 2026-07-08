import { widgetRegistry } from "@/services/widgets/WidgetRegistry";
import { defineWidget, type WidgetDescriptor, type WidgetRenderer } from "@/models/widgetDescriptor";
import type { WidgetSizeSpec } from "@/models/widgetDescriptor";
import * as W from "@/components/runtime/widgets/SystemWidgets";

interface Spec {
  id: string;
  name: string;
  icon: string;
  size: WidgetSizeSpec;
  min: WidgetSizeSpec;
  max: WidgetSizeSpec;
  render: WidgetRenderer;
  description: string;
}

const specs: Spec[] = [
  {
    id: "system.clock",
    name: "Uhr",
    icon: "clock",
    size: { w: 3, h: 2 },
    min: { w: 2, h: 2 },
    max: { w: 6, h: 3 },
    description: "Aktuelle Uhrzeit.",
    render: () => <W.ClockWidget />,
  },
  {
    id: "system.date",
    name: "Datum",
    icon: "calendar",
    size: { w: 3, h: 2 },
    min: { w: 2, h: 2 },
    max: { w: 6, h: 3 },
    description: "Aktuelles Datum.",
    render: () => <W.DateWidget />,
  },
  {
    id: "system.dashboard-title",
    name: "Dashboard-Titel",
    icon: "type",
    size: { w: 6, h: 2 },
    min: { w: 3, h: 1 },
    max: { w: 16, h: 3 },
    description: "Dashboard-Titel + Untertitel.",
    render: ({ instance }) => (
      <W.DashboardTitleWidget title={instance.title} subtitle={instance.subtitle} />
    ),
  },
  {
    id: "system.dashboard-header",
    name: "Dashboard-Header",
    icon: "panel-top",
    size: { w: 8, h: 2 },
    min: { w: 4, h: 2 },
    max: { w: 16, h: 3 },
    description: "Header mit Titel und Uhrzeit.",
    render: ({ instance }) => <W.DashboardHeaderWidget title={instance.title} />,
  },
  {
    id: "system.welcome",
    name: "Willkommen",
    icon: "hand",
    size: { w: 6, h: 3 },
    min: { w: 4, h: 2 },
    max: { w: 12, h: 5 },
    description: "Freundlicher Begrüßungstext.",
    render: () => <W.WelcomeWidget />,
  },
  {
    id: "system.server-status",
    name: "Serverstatus",
    icon: "server",
    size: { w: 3, h: 2 },
    min: { w: 2, h: 2 },
    max: { w: 6, h: 3 },
    description: "Aktiver Server und Zustand.",
    render: () => <W.ServerStatusWidget />,
  },
  {
    id: "system.connection-status",
    name: "Verbindungsstatus",
    icon: "wifi",
    size: { w: 3, h: 2 },
    min: { w: 2, h: 2 },
    max: { w: 6, h: 3 },
    description: "Aktuelle Verbindung + Latenz.",
    render: () => <W.ConnectionStatusWidget />,
  },
  {
    id: "system.discovery-status",
    name: "Discovery",
    icon: "radar",
    size: { w: 3, h: 2 },
    min: { w: 2, h: 2 },
    max: { w: 6, h: 3 },
    description: "Discovery-Status + Gerätezahl.",
    render: () => <W.DiscoveryStatusWidget />,
  },
  {
    id: "system.sync-status",
    name: "Sync",
    icon: "refresh-cw",
    size: { w: 3, h: 2 },
    min: { w: 2, h: 2 },
    max: { w: 6, h: 3 },
    description: "Synchronisationsstatus.",
    render: () => <W.SyncStatusWidget />,
  },
  {
    id: "system.info",
    name: "Systeminformationen",
    icon: "info",
    size: { w: 4, h: 2 },
    min: { w: 3, h: 2 },
    max: { w: 8, h: 3 },
    description: "Server- und Systemzahlen.",
    render: () => <W.SystemInfoWidget />,
  },
  {
    id: "system.app-version",
    name: "App-Version",
    icon: "package",
    size: { w: 2, h: 2 },
    min: { w: 1, h: 1 },
    max: { w: 4, h: 2 },
    description: "Aktuelle App-Version.",
    render: () => <W.AppVersionWidget />,
  },
  {
    id: "system.user-profile",
    name: "Benutzerprofil",
    icon: "user",
    size: { w: 4, h: 2 },
    min: { w: 3, h: 2 },
    max: { w: 8, h: 3 },
    description: "Benutzerprofil (Vorbereitung).",
    render: () => <W.UserProfileWidget />,
  },
  {
    id: "system.quick-actions",
    name: "Quick Actions",
    icon: "zap",
    size: { w: 4, h: 2 },
    min: { w: 2, h: 2 },
    max: { w: 8, h: 3 },
    description: "Schnellaktionen (Vorbereitung).",
    render: () => <W.QuickActionsWidget />,
  },
  {
    id: "system.hero-greeting",
    name: "Hero — Begrüßung",
    icon: "sparkles",
    size: { w: 8, h: 3 },
    min: { w: 4, h: 2 },
    max: { w: 16, h: 5 },
    description: "Zeitabhängige Hero-Begrüßung.",
    render: () => <W.HeroGreetingWidget />,
  },
  {
    id: "system.hero-status",
    name: "Hero — Systemstatus",
    icon: "activity",
    size: { w: 8, h: 3 },
    min: { w: 4, h: 2 },
    max: { w: 16, h: 5 },
    description: "Gesamtsystemstatus als Hero-Widget.",
    render: () => <W.HeroStatusWidget />,
  },
];

let registered = false;

export function registerSystemWidgets(): void {
  if (registered) return;
  registered = true;
  for (const s of specs) {
    const desc: WidgetDescriptor = defineWidget({
      id: s.id,
      name: s.name,
      category: "system",
      description: s.description,
      icon: s.icon,
      defaultSize: s.size,
      minSize: s.min,
      maxSize: s.max,
      supportedLayouts: [
        "phone-portrait",
        "phone-landscape",
        "tablet-portrait",
        "tablet-landscape",
        "desktop",
      ],
      settings: [],
      capabilities: ["themeable", "movable", "resizable"],
      version: 1,
      render: s.render,
    });
    widgetRegistry.register(desc);
  }
}

export const SYSTEM_WIDGET_IDS = specs.map((s) => s.id);
