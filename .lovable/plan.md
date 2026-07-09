# Teil 10 von 18 – Timeline, History, Analytics (mit Ergänzungen)

Vollständig generische Timeline-, Historien- und Analytics-Plattform auf Basis der bestehenden Architektur. Alle Quellen registrieren sich ausschließlich über `TimelineSourceDescriptor` / `TimelineSourceRegistry`. Keine parallelen Datenmodelle, keine direkten WebSocket-Aufrufe, keine Sonderlogik.

## 1. Gemeinsame Datenmodelle (Vorbereitung)

Neue, projektweit wiederverwendbare Modelle in `src/models/`:

### 1.1 Severity (`src/models/severity.ts`)
Generisches Severity-Modell, später gemeinsam genutzt von Timeline, Event Center, Notifications, Discovery, WebSocket, Automationen, Systemmeldungen.

```ts
export type Severity = 'info' | 'success' | 'warning' | 'error' | 'critical';
export const SEVERITY_ORDER: Record<Severity, number> = { info:0, success:1, warning:2, error:3, critical:4 };
export interface SeverityDescriptor { severity: Severity; label: string; color: string; icon: string; }
```
Nur Datenmodell + Descriptor-Tabelle. Keine Engine, keine UI.

### 1.2 EventCategory (`src/models/eventCategory.ts`)
Gemeinsames Kategorien-Modell für Event Center, Timeline, Notifications.

```ts
export type EventCategory =
  | 'system' | 'device' | 'room' | 'scene' | 'automation'
  | 'group'  | 'security' | 'energy' | 'network' | 'user' | 'custom';
export interface EventCategoryDescriptor { category: EventCategory; label: string; icon: string; color: string; }
```
Nur Datenmodell + Descriptor-Tabelle.

### 1.3 Timeline-Erweiterungen (`src/models/timeline.ts`)
Bestehendes `TimelineEntry` aus Teil 9 wird um **optionale** Felder erweitert (keine bestehenden Einträge werden invalidiert):

```ts
severity?: Severity;
category?: EventCategory;
acknowledged?: boolean;
pinned?: boolean;
archived?: boolean;
sourceVersion?: string;
```

Ebenso erweiterter `TimelineFilter` (severity, category, acknowledged, pinned, archived – alle optional).

### 1.4 Weitere Modelle
- `HistoryEntry` (Alias von TimelineEntry für persistente Historie)
- `StatisticsSnapshot`, `EnergyStatistics` (nur Modell)
- `ChartDescriptor`, `ChartSeries`, `ChartPoint`
- `AutomationDebugTrace`, `AutomationSimulationResult`

## 2. Registries (generisch, offen erweiterbar)

Unter `src/services/timeline/` bzw. `src/services/charts/`:

- `TimelineSourceRegistry` – einzige Registrierungsstelle für neue Quellen. Kein Switch/If in der Timeline-Engine; die Engine iteriert nur über registrierte Descriptoren.
- `ChartRegistry` – Linie, Balken, Fläche, Kreis, Donut; Heatmap als Descriptor vorbereitet.
- `StatisticsRegistry` – Contributoren (Anzahl Geräte, Online/Offline, Schaltvorgänge, Szenen-, Automations-Läufe, Fehler, Warnungen, Ø-Laufzeiten).
- `EnergyRegistry` – Vorbereitung (leer, kein Sonderweg).
- `SeverityRegistry` (leichtgewichtig) – Descriptor-Mapping, damit UI-Konsumenten Farben/Icons konsistent auflösen.
- `EventCategoryRegistry` (leichtgewichtig) – analog.

Alle Registries folgen dem bestehenden Muster (Widget-, Scene-, Group-, Automation-Registries).

## 3. Timeline Sources (Selbstregistrierung)

Adapter je Domäne, ausschließlich auf bestehende Event-Emitter/Stores zugreifend:

- `deviceTimelineSource` – Device-Events / devicesStore
- `sceneTimelineSource` – SceneEvents + sceneExecutionsStore
- `groupTimelineSource` – GroupEvents + groupExecutionsStore
- `automationTimelineSource` – AutomationEvents + automationExecutionsStore
- `systemTimelineSource` – App-Lifecycle, Discovery-Status, WebSocket-Status
- Descriptor-Platzhalter `notificationTimelineSource` (disabled, Teil 11)
- Descriptor-Platzhalter `userTimelineSource` (disabled)

Registrierung ausnahmslos über `TimelineSourceRegistry.register(descriptor)` in `bootstrap.ts`.

## 4. Stores

- `timelineStore` – zeitlich sortierter Ringpuffer, indexiert nach source/reference/category/severity
- `historyStore` – In-Memory-Persistenz + Export
- `statisticsStore` – berechnete Snapshots
- `energyStore` – Vorbereitung
- `chartStore` – aktive Diagramm-Definitionen

O(1)-Lookups, memoized Selectors, kompatibel zu bestehender Store-Architektur.

## 5. Chart Engine

`src/services/charts/`: generischer `ChartRenderer`, Typen ausschließlich über `ChartRegistry`. Nutzung vorhandener Chart-Primitives des Projekts.

## 6. Automation Debugger + Simulation

- `AutomationDebugger` – schreibt Traces via `automationTimelineSource` (Trigger, Bedingungen, Aktionen, Dauer, Fehler, Retry, Rollback).
- `AutomationSimulator` – optionaler `dryRun: true` im `ExecutionContext` (additiv, ändert keine bestehende Signatur). Trigger/Conditions/Actions werden ausgewertet, `CommandQueue` sendet nichts an Geräte.

Keine Änderungen an CommandQueue oder Universal Control Engine.

## 7. Widgets (Widget Registry)

Neu in `src/services/widgets/builtin/analytics.tsx`:
`timeline`, `recent.activity`, `statistics`, `energy` (Platzhalter), `automation.debug`, `execution.history`, `system.status`.

## 8. Routen / UI (nur Erweiterungen)

- Neu: `/_app/timeline`, `/_app/history`, `/_app/analytics`
- Erweitert: Detail-Tabs bei Devices, Rooms, Scenes, Automations (Historie, Diagramme, Timeline, Debugger, Simulation).

Ausschließlich bestehendes Glass-Design-System.

## 9. Import / Export

JSON-Export für Timeline, History, Statistics; Import vorbereitet.

## 10. Performance & Accessibility

Virtualisierung, Memoization, Selectors, Lazy Loading, Code Splitting. Große Touchflächen, ARIA-Labels, `aria-live="polite"` bei neuen Einträgen.

## 11. Bootstrap-Integration

`bootstrap.ts`: Registrierung aller Registries und Timeline Sources, `stopTimeline()` im Lifecycle.

## 12. Erweiterungspunkt-Garantie

Die Timeline-Engine besitzt **keine** quellenspezifische Switch/If-Logik. Neue Quellen (z. B. Notifications in Teil 11) benötigen ausschließlich einen `TimelineSourceDescriptor` und `TimelineSourceRegistry.register(...)` – keine Änderung an Engine, Stores oder UI.

## Nicht enthalten

Keine Cloud, KI, Push, Benutzerverwaltung, Notification Engine, neue Auth-Flows. Severity und EventCategory werden **nur als Datenmodell** vorbereitet.

## Technische Details

- Neue optionale Timeline-Felder brechen keine bestehende Persistenz/Serialisierung; Serialisierer ignorieren `undefined`.
- `SeverityRegistry` und `EventCategoryRegistry` sind rein deklarative Descriptor-Tabellen; kein Runtime-Verhalten.
- `TimelineSourceDescriptor` erhält Felder: `id`, `label`, `icon`, `color`, `category?: EventCategory`, `defaultSeverity?: Severity`, `enabled`, `subscribe(emit)`, `unsubscribe()`, `sourceVersion?: string`.
- Refaktorierungen sind erlaubt, entfernen aber keine bestehende Funktion.
