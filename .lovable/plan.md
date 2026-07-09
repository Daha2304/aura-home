# Teil 9 – Automation Engine

Ziel: eine vollständig generische Automation Engine, ausschließlich über die bereits vorbereiteten `triggerRegistry`, `conditionRegistry`, `actionRegistry` (`src/services/automations/index.ts`) und alle existierenden Systeme (Device/Capability Registry, Scene/Group Manager, Command Queue, Widget Registry, Intelligence Layer, Stores, Design System). Kein paralleles Datenmodell, keine direkten WebSocket-Aufrufe, keine gerätespezifische Logik. Das bestehende dünne `automation.ts` + `automationsStore.ts` + `_app.automations.tsx` wird kompatibel erweitert (keine Breaking Changes; alte Felder bleiben lesbar).

## 1. Datenmodelle (`src/models/`)

`automation.ts` wird erweitert; alle bestehenden Felder (`triggers`, `conditions`, `actions`, `enabled`, `order`) bleiben. Neu bzw. präzisiert:

- `Automation` – `id`, `uuid`, `name`, `description?`, `icon?`, `color?`, `category?`, `tags[]`, `favorite`, `enabled` (bleibt = "aktiv"), `priority`, `version`, `createdAt`, `updatedAt`, `createdBy?`, `updatedBy?`, `custom`, `triggers[]`, `conditions` (Root-`ConditionNode`, siehe unten), `actions[]`, `errorStrategy` (`abort` | `continue` | `retry`), `templateId?`, `archived`.
- `AutomationTrigger` – bleibt: `id`, `kind` (Registry-ID), `config`. `kind` ist offener String – konkrete Werte definiert die Registry (`device.state`, `device.online`, `device.offline`, `capability.changed`, `room.state`, `group.state`, `scene.started`, `scene.finished`, `time`, `date`, `weekday`, `sunrise`, `sunset`, `timer`, `system.start`, `custom`).
- `AutomationCondition` – als **Baum** (Boolean-Algebra ohne Ausführungslogik-Bruch):
  ```
  type ConditionNode =
    | { id, kind: "and" | "or", children: ConditionNode[] }
    | { id, kind: "not", child: ConditionNode }
    | { id, kind: string /* registry id */, config: Record<string, unknown> }
  ```
  Blatt-`kind`s aus Registry: `compare.eq`, `compare.neq`, `compare.gt`, `compare.lt`, `compare.between`, `capability`, `device`, `group`, `room`, `scene`, `variable`, `custom`. Backwards-Compat: bestehendes flaches `conditions: AutomationCondition[]` wird beim Laden in einen impliziten `and`-Baum migriert.
- `AutomationAction` – `id`, `kind` (Registry-ID: `device.control`, `group.control`, `scene.start`, `delay`, `variable.set`, `automation.enable`, `automation.disable`, `custom`), `config`, `delayMs?`, `parallel?`, `optional?`, `errorStrategy?`, `retry?: { count, backoffMs }`, `rollbackHint?` (Vorbereitung).
- `automationTemplate.ts` – eigene Struktur analog `sceneTemplate.ts`: `id`, `uuid`, `name`, `description`, `icon`, `color`, `category`, `tags`, `version`, `parameters[]` (wiederverwendet `SceneParameter`-Form), `triggers`, `conditions`, `actions`, `builtin?`.
- `automationVersion.ts` – Snapshot: `versionNumber`, `createdAt`, `createdBy?`, `payload` (Automation ohne `version`).
- `automationExecution.ts` – `id`, `automationId`, `triggerId?`, `status` (`planned` | `running` | `partial` | `succeeded` | `failed` | `cancelled` | `skipped-conditions`), `startedAt`, `finishedAt?`, `progress: { completed, total, failed, cancelled }`, `steps[]` (`actionId`, `commandIds[]`, `state`, `error?`, `startedAt`, `finishedAt`), `conditionsResult?`, `rollbackSnapshot[]` (Vorbereitung, keine Ausführung), `correlationId`.
- `automationVariable.ts` – schlanke Variablen-Definition (`id`, `key`, `type`, `value`, `scope: "automation" | "global"`). Persistenz global über neuen Store.
- `automationEvents.ts` – TypedEmitter-Event-Map: `automationCreated`, `automationUpdated`, `automationDeleted`, `automationEnabled`, `automationDisabled`, `automationTriggered`, `automationStarted`, `automationProgress`, `automationCompleted`, `automationFailed`, `automationCancelled`.
- `timeline.ts` – **nur Datenmodell + Erweiterungspunkt** für Teil 10: `TimelineEntry = { id, source: "automation" | "scene" | "device" | "notification", refId, kind, timestamp, payload }` + `TimelineSourceDescriptor` mit `subscribe(cb)`. Keine Timeline-UI, keine Route.
- Re-Exports in `models/index.ts`.

## 2. Descriptor-Erweiterungen der bestehenden Registries

Die vorbereiteten Registries in `src/services/automations/index.ts` erhalten voll typisierte Descriptor-Shapes (ohne Bruch):

```ts
TriggerDescriptor  { id, label, version, category, schema?, subscribe(ctx, cfg, fire) => Unsubscribe }
ConditionDescriptor{ id, label, version, category, schema?, evaluate(ctx, cfg) => boolean }
ActionDescriptor   { id, label, version, category, schema?, plan(ctx, cfg) => PlannedCommand[] }
```

`PlannedCommand` referenziert ausschließlich `commandQueue.enqueue(deviceId, capabilityId, value, opts)` – Actions liefern nur Pläne, ausgeführt wird zentral. Kein direkter WS-Zugriff.

Built-ins werden in `src/services/automations/builtin/` registriert, in kleine Dateien pro Familie (`triggers.time.ts`, `triggers.device.ts`, `triggers.scene.ts`, `triggers.group.ts`, `triggers.room.ts`, `triggers.system.ts`, `conditions.boolean.ts`, `conditions.compare.ts`, `conditions.entities.ts`, `conditions.variable.ts`, `actions.device.ts`, `actions.group.ts`, `actions.scene.ts`, `actions.control.ts`, `actions.variable.ts`), gebündelt in `builtin/index.ts` und einmalig in `bootstrap.ts` aufgerufen (`registerBuiltinAutomationDescriptors()`).

## 3. Services (`src/services/automations/`)

```
AutomationRegistry.ts    // O(1)-Lookup, byCategory, byTag, byDevice/Group/Scene/Room
AutomationManager.ts     // CRUD + Versionierung + Persistenz ("automations.v1")
AutomationValidator.ts   // Zod + Referenz-Checks (Devices/Groups/Scenes/Capabilities/Registries)
AutomationScheduler.ts   // hält Trigger-Subscriptions am Leben, Rescheduling bei Update/Enable
AutomationExecutor.ts    // Conditions -> Action Pipeline -> commandQueue
AutomationEvents.ts      // TypedEmitter<AutomationEventMap>
AutomationVersionStore.ts// Ringpuffer je Automation (max. 20)
AutomationTemplateRegistry.ts / AutomationTemplateManager.ts
AutomationHistory.ts     // Vorbereitung: append-only Ringpuffer, feed für timeline.ts
automationSerialization.ts // JSON Import/Export inkl. Versionen + Templates (Zod, merge/replace)
builtin/…                // siehe oben
index.ts
```

### Scheduler & Trigger

- `AutomationScheduler.start()` iteriert aktive Automationen und ruft `triggerDescriptor.subscribe(ctx, cfg, () => executor.trigger(automationId, triggerId, payload))`. Rückgabe = `Unsubscribe`; wird bei Disable/Update/Delete strikt aufgeräumt.
- Trigger-Contexte greifen ausschließlich auf existierende Emitter/Stores zu:
  - `deviceRegistry` / `devicesStore` Events → `device.*`, `capability.changed`
  - `roomsStore` / `RoomManager` Events → `room.state`
  - `groupsStore` / `GroupEvents` → `group.state`
  - `sceneEvents` → `scene.started`, `scene.finished`
  - Zeit-Trigger nutzen einen einzelnen tickenden Timer im Scheduler (kein pro-Automation `setInterval`), Sonnenzeiten aus Settings/Geoposition (falls vorhanden) – rein clientseitig, keine Cloud.
  - `system.start` feuert einmalig beim ersten `AutomationScheduler.start()`.

### Condition Evaluation

- `AutomationExecutor.evaluate(node, ctx)` läuft rekursiv über `and`/`or`/`not` und delegiert Blätter an `conditionRegistry.get(kind).evaluate(ctx, cfg)`. Kontext liefert live Stores (`devicesStore`, `roomsStore`, `groupsStore`, `scenesStore`, Variablen-Store) – lesen only.

### Action Pipeline

- Sequenziell + parallel + verzögert, `errorStrategy` (`abort`/`continue`/`retry`) und `retry.count/backoffMs` pro Action.
- Jede Action liefert `PlannedCommand[]`; der Executor ruft `commandQueue.enqueue(...)` mit gemeinsamer `correlationId = executionId`.
- Fortschritt wird über `commandQueue.on('completed'|'failed'|'cancelled')` per `correlationId` fortgeschrieben und als `automationProgress` gespuscht.
- `rollbackSnapshot[]` wird **nur befüllt** (Vorwerte aus `devicesStore`); ein `undo(executionId)`-Kopf existiert und wirft `NotImplemented`.
- Spezial-Actions ohne Command Queue (`delay`, `variable.set`, `automation.enable/disable`, `scene.start`) laufen über die bestehenden Manager (`SceneExecutor.run`, `AutomationManager.setEnabled`, Variablen-Store) – keine neuen Pfade.

### Validator

- Zod-Schemas + Referenz-Checks gegen `deviceRegistry`, `capabilityRegistry`, `groupsStore`, `scenesStore`, `triggerRegistry/conditionRegistry/actionRegistry`. Liefert `{ ok, errors[], warnings[] }`. Wird bei CRUD und vor `run` aufgerufen.

## 4. Stores (`src/store/slices/`)

Der bestehende `automationsStore` wird auf das erweiterte Modell migriert (Migration konvertiert alte flache `conditions[]` in impliziten `and`-Knoten und ergänzt fehlende Felder). Neue Stores analog Szenen:

- `automationsStore.ts` – `automations`, `byId`, `byCategory`, `favorites`, `recentIds`, `revision`, CRUD, `toggle`.
- `automationExecutionsStore.ts` – aktive/historische Ausführungen, `byAutomation`, `progress`, `rollbackSnapshot`.
- `automationVersionsStore.ts` – Versionen je Automation.
- `automationTemplatesStore.ts` – `byId`, `byCategory`.
- `automationVariablesStore.ts` – globale Variablen (persistiert).

Alle O(1)-Lookups, memoized Selectors, keine Duplikation von Command-State (referenziert `useCommandsStore` per `correlationId`).

## 5. Intelligence Layer

Nur neue Contributors, keine Änderungen an bestehenden Aggregatoren:

- `AutomationContributor` – pro Raum: Anzahl aktiver/laufender Automationen, letzte Ausführung, Fehlerquote. Emittiert `aggregationUpdated`, ergänzt `roomMetrics.custom.automations` / `houseMetrics.custom.automations`.
- Registrierung in `registerBuiltinContributors()`.

## 6. Widgets (Widget Registry)

Registrierung ausschließlich über `widgetRegistry.register(defineWidget(...))` in `src/services/widgets/builtin/automations.tsx`, aufgerufen aus `builtin/index.ts`. Neue Widgets: `automation.button`, `automation.status`, `automation.favorites`, `automation.running`. `automation.timeline` bleibt **vorbereitet** (Descriptor + Placeholder-Render, nutzt bereits `timeline.ts`-Modell). Ausschließlich `GlassCard`, `IconButton`, `SegmentedControl`, `PageTransition`.

## 7. UI (Design System)

Alle Routen ersetzen bzw. ergänzen das aktuelle Minimal-Listing:

- `src/routes/_app.automations.tsx` – Bibliothek: Glas-Grid, Suche, Kategorie-Chips, Favoriten, „Zuletzt ausgeführt", Framer-Motion Stagger.
- `src/routes/_app.automations.$automationId.tsx` – Detail: Trigger/Conditions/Actions als lesbare Karten, letzte Ausführungen mit Progress (completed/total), Versionsliste, Restore, Export. Rollback-Button gerendert aber `disabled` mit Tooltip „vorbereitet".
- `src/routes/_app.automations.$automationId.edit.tsx` – **wizardartiger Card-Editor** (kein Blockly, keine freien Blöcke):
  1. Basis (Name, Icon, Farbe, Kategorie, Priorität, errorStrategy)
  2. Trigger – Karten aus `triggerRegistry`, pro Trigger inline Konfig-Formular (Schema-getrieben)
  3. Conditions – hierarchische Card-Struktur (`and`/`or`/`not` als Container-Karten, Blätter aus `conditionRegistry`), Drag & Drop für Reihenfolge innerhalb einer Gruppe
  4. Actions – DnD-Reihenfolge, pro Karte `delayMs`/`parallel`/`errorStrategy`/`retry`
  5. Prüfen (Validator-Report) & Speichern
- `src/routes/_app.automations.new.tsx` – Einstieg: „leer" oder „aus Template" (Template-Picker aus `automationTemplatesStore`).
- Panels über `DevicePanelRegistry` / `RoomPanelRegistry`: „Verwendete Automationen" auf Device- und Room-Detail; Szenen-/Gruppen-Detail zeigen Automationen, die sie als Trigger/Condition/Action verwenden (Rückverweise berechnet aus `automationsStore` via memoized Selector).
- Reine Kompositionen bestehender DS-Komponenten (`GlassCard`, `GlassPanel`, `SegmentedControl`, `IconButton`, `PageTransition`, `HeroTransition`, `SharedLayout`). Kein neues Styling.

## 8. Import / Export

`automationSerialization.ts` liefert versionsstabiles JSON (`schemaVersion`, `exportedAt`, `automations[]`, `templates[]`, `versions{}`, `variables[]`). Zod-Validierung, `merge` | `replace`. Fehler landen im bestehenden `errorBus`.

## 9. Vorbereitung Teil 10 (Timeline)

- `timeline.ts` (siehe oben) definiert `TimelineSourceDescriptor`.
- `AutomationHistory` implementiert bereits einen `TimelineSourceDescriptor` (aber nicht registriert außerhalb der Automation-Domäne). Scene- und Notification-Feeds werden **nicht** angefasst; die spätere Timeline-Route kann Sources kombinieren.
- Keine Timeline-UI, keine Route, kein Widget-Inhalt – nur `automation.timeline` als Placeholder-Widget.

## 10. Performance & Accessibility

- `React.memo`, `useMemo`-Selectors, Slice-fähige Renderer, stabile Keys, Lazy Import (`React.lazy`) der Editor-Route für Code-Splitting.
- ≥ 44 px Touchflächen, `aria-label`, `role="list"/"listitem"`, klare Fokusreihenfolge im Wizard, Screenreader-Ansagen bei Executionsstatus.

## 11. Was nicht passiert

Kein Geofencing, keine Cloud, keine Push-Notifications, keine KI, keine Historien-Diagramme, keine Timeline-UI. **Keine Änderungen an Command Queue, Universal Control Engine, Discovery, Registry, Scene/Group Manager oder bestehenden Aggregatoren** – alle Erweiterungen laufen über bestehende Registries, Stores und Event-Kanäle.

```text
Trigger (Registry) ─▶ Scheduler ─▶ Executor
                                     │
                                     ├─▶ ConditionRegistry.evaluate (Baum)
                                     │
                                     └─▶ ActionRegistry.plan ─▶ CommandQueue ─▶ wsManager
                                                             └▶ SceneExecutor / GroupExecutor / VariablesStore
Stores/Widgets/Intelligence/Rooms/Devices lesen ausschließlich Stores.
```

Ergebnis: eine vollständig generische, registry-basierte Automation Engine mit Versionierung, Templates, Wizard-Editor, Bibliothek, Room/Device/Scene/Group-Integration, Widgets und Timeline-Vorbereitung – ohne parallele Datenmodelle, ohne direkte WebSocket-Aufrufe, ausschließlich über die vorhandene Architektur.
