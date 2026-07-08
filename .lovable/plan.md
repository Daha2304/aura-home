# Teil 8 – Szenen & Gerätegruppen

Ziel: eine vollständig generische Szenen- und Gerätegruppen-Plattform, die ausschließlich vorhandene Systeme nutzt (Device Registry, Capability Registry, Universal Control Engine, Command Queue, Widget Registry, Intelligence Layer, Room Manager, Design System, Event System, Stores). Keine parallelen Datenmodelle, keine Sonderlogik pro Gerätetyp, keine Änderungen an Command Queue oder Universal Control Engine.

## 1. Datenmodelle (`src/models/`)

Das bestehende `scene.ts` wird erweitert (keine Breaking Changes, alte Felder bleiben erhalten).

- `scene.ts` – `Scene`, `SceneCategory`, `SceneStatus`, `SceneErrorStrategy`. Felder: `id`, `uuid`, `name`, `description`, `icon`, `color`, `category`, `favorite`, `tags[]`, `version`, `active`, `archived`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `custom`, `actions[]`, `order`, `parameters[]`, `templateId?`.
- `sceneAction.ts` – `id`, `deviceId?`, `groupId?`, `capabilityId`, `targetValue`, `previousValue?`, `delayMs`, `priority`, `parallel`, `optional`, `errorStrategy` (`abort` | `continue` | `retry`), `comment`, `condition?` (Placeholder Teil 9), `parameterRef?` (verknüpft mit `SceneParameter`).
- `sceneParameter.ts` – **Vorbereitung ohne Ausführungslogik**: `id`, `key`, `label`, `type` (`boolean` | `number` | `string` | `enum` | `device` | `group` | `capability` | `color`), `default?`, `options?`, `min?`, `max?`, `required?`, `description?`. Wird in Szenen persistiert, aber nicht ausgewertet.
- `sceneTemplate.ts` – **eigene Datenstruktur**: `id`, `uuid`, `name`, `description`, `icon`, `color`, `category`, `tags[]`, `version`, `createdAt`, `updatedAt`, `parameters[]`, `actions[]` (mit `parameterRef` auf Template-Parameter), `builtin?`. Keine UI notwendig – nur Registry + Store.
- `sceneVersion.ts` – Snapshot: `versionNumber`, `createdAt`, `createdBy`, `payload` (vollständige Scene ohne `version`).
- `sceneExecution.ts` – `id`, `sceneId`, `status` (`planned` | `running` | `partial` | `succeeded` | `failed` | `cancelled`), `startedAt`, `finishedAt?`, `progress: { completed, total, failed, cancelled }`, `steps[]` (pro Aktion: `actionId`, `commandIds[]`, `state`, `error?`), `undoable`, `undoSnapshot[]` (Vorwerte je Gerät/Capability – **nur Datenerfassung**, Ausführung folgt später).
- `deviceGroup.ts` – `DeviceGroup`, `DeviceGroupKind` (`light` | `outlet` | `blind` | `thermostat` | `sensor` | `media` | `mixed` | `virtual` | `dynamic`), `DeviceGroupStatus`. Felder: `id`, `uuid`, `name`, `description`, `icon`, `color`, `category`, `favorite`, `tags[]`, `version`, `deviceIds[]`, `groupIds[]` (**verschachtelte Gruppen**), `capabilities[]`, `status`, `custom`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`.
- `sceneEvents.ts`, `groupEvents.ts` – TypedEmitter-Event-Maps für sceneCreated/Updated/Deleted/Executed/ExecutionStarted/Completed/Failed und groupCreated/Updated/Deleted.
- Re-Exports in `models/index.ts`.

## 2. Services

```
src/services/scenes/
  SceneRegistry.ts        // O(1)-Lookup, byCategory, byTag, byDevice, byGroup
  SceneManager.ts         // CRUD + Versionierung + Persistenz ("scenes.v1")
  SceneTemplateRegistry.ts// Template-Registry (O(1), byCategory)
  SceneTemplateManager.ts // Templates registrieren + instanziieren zu Scene
  SceneParameterRegistry.ts // Parameter-Typ-Descriptors (boolean/enum/device/…)
  SceneVersionStore.ts    // Ringpuffer je Szene, max. 20 Versionen
  SceneExecutor.ts        // plant Aktionen → CommandQueue, Progress, Undo-Snapshot
  SceneEvents.ts
  sceneSerialization.ts   // JSON Import/Export inkl. Versionen + Templates
  index.ts
src/services/groups/
  GroupRegistry.ts        // O(1)-Lookup, byKind, byDevice, byParentGroup
  GroupManager.ts         // CRUD, Zyklenerkennung bei set/add
  GroupResolver.ts        // rekursive Expansion (Gruppe → Geräte, cycle-safe)
  GroupExecutor.ts        // Fan-out zu CommandQueue
  GroupEvents.ts
  groupSerialization.ts
  index.ts
```

### Verschachtelte Gruppen mit Zyklenerkennung

- `GroupManager.setChildren(groupId, {deviceIds, groupIds})` prüft vor dem Speichern per DFS, ob `groupIds` einen Zyklus erzeugt (`hasCycle(groupId, candidates)`). Bei Zyklus: kein Write, `errorBus.report` + Rückgabe `{ok:false, reason:"cycle"}`.
- `GroupResolver.expand(groupId)` liefert eine deduplizierte, cycle-safe `Set<deviceId>` per DFS mit `visited`-Set. Ergebnis wird in `groupsStore.expandedById` memoisiert und bei jeder Group-Änderung invalidiert.
- Alle Konsumenten (Executor, Intelligence Contributor, Widgets) lesen ausschließlich das expandierte Set – nirgends eigene Rekursion.

### Ausführung (Command Queue unverändert)

- `SceneExecutor.run(sceneId, args?)` erzeugt eine `SceneExecution` mit `progress.total = Σ konkrete Zielgeräte` (nach Group-Expansion). Für jede Aktion:
  1. `previousValue` aus `devicesStore` in `undoSnapshot` schreiben (Vorbereitung Undo – keine Ausführung),
  2. `commandQueue.enqueue(deviceId, capabilityId, targetValue, { optimistic: true, correlationId: executionId })`,
  3. `delayMs` respektieren, `parallel`-Aktionen bündeln, `priority` sortiert.
- Fortschritt wird über `commandQueue.on('completed'|'failed'|'cancelled')` per `correlationId` fortgeschrieben (`progress.completed`, `progress.failed`). Emittiert `sceneExecutionStarted`, `sceneExecutionProgress`, `sceneExecutionCompleted|Failed`. **Keine Änderungen an der Command Queue** – nur Listener auf vorhandene Events.
- `undoable: true` wird gesetzt, sobald ein vollständiger `undoSnapshot` erfasst wurde. Ein `SceneExecutor.undo(executionId)`-Methodenkopf existiert und ist als „prepared" markiert (throw `NotImplemented` bis Teil 9/10). Die Datenstruktur ist vollständig.
- `errorStrategy`: `abort` bricht die Restplanung ab, `continue` markiert die Aktion als `failed` und macht weiter, `retry` re-enqueued einmalig via `commandQueue.enqueue` (kein Eingriff in die Queue-Retry-Logik selbst).

### Gruppenaktionen

- `GroupExecutor.apply(groupId, capabilityId, value)` löst per `GroupResolver` auf, filtert Geräte über `capabilityRegistry.supports(device, capabilityId)` und ruft für jedes Gerät `commandQueue.enqueue(...)`. Kein zweites Ausführungsmodell.

### Templates

- `SceneTemplateRegistry` verwaltet Built-in und importierte Templates (`register`, `unregister`, `get`, `listByCategory`).
- `SceneTemplateManager.instantiate(templateId, params)` erzeugt eine reguläre `Scene` (mit Referenz `templateId`), löst `parameterRef`-Platzhalter beim Erstellen der Actions bereits auf und persistiert über `SceneManager.create()`. Keine UI erforderlich; API ist bereit für Teil 9+.

## 3. Stores (`src/store/slices/`)

Ersetzen den heutigen dünnen `scenesStore` (Migration übernimmt vorhandene Szenen). Alle Selectors memoisiert, O(1)-Lookups über `byId`.

- `scenesStore.ts` – `scenes`, `byId`, `byCategory`, `favorites`, `recentIds`, CRUD-Actions, `revision`.
- `sceneTemplatesStore.ts` – Templates (byId, byCategory).
- `sceneVersionsStore.ts` – Versionen je Szene.
- `sceneExecutionsStore.ts` – aktive und historische Ausführungen, `byScene`, aktueller `progress`, `undoSnapshot`.
- `groupsStore.ts` – `byId`, `byKind`, `favorites`, `expandedById` (Cache der aufgelösten Gerätemenge).
- `groupExecutionsStore.ts` – Live-Status der Fan-out-Kommandos (verlinkt auf `useCommandsStore` per `correlationId`).

Kein Duplizieren von Command-State – die Ausführungs-Stores speichern nur Metadaten und referenzieren `useCommandsStore`.

## 4. Intelligence Layer

Neue schlanke Contributors ohne Änderung der bestehenden Aggregatoren:

- `SceneContributor` – aggregiert Szenen pro Raum (via Aktions-Devices) und Haus. Ergänzt `roomMetrics.custom.scenes`.
- `GroupContributor` – dito für (expandierte) Gruppen.
- Registrierung in `registerBuiltinContributors()` – bestehender Erweiterungspunkt, keine neue Architektur.

## 5. Universal Control Engine

Keine Änderungen. Zwei neue **Descriptor-Sources** über bestehende Registries:

- `SceneControlSource` – synthetischer `buttonControl`-`ControlSpec`, damit Szenen im Universal Control Renderer als Quick Action erscheinen.
- `GroupControlSource` – meldet für Gruppen die gemeinsamen Capabilities (Schnittmenge über expandierte Geräte) an die `CapabilityRegistry`; der Renderer erzeugt automatisch passende Controls. Neue Gerätetypen funktionieren dadurch ohne UI-Anpassung.

## 6. Widgets (Widget Registry)

Registrierung ausschließlich über `widgetRegistry.register(defineWidget(...))` in `src/services/widgets/builtin/scenes.tsx` und `groups.tsx`, aufgerufen aus `services/widgets/builtin/index.ts`.

Neue Widgets: `scene.button`, `scene.grid`, `scene.favorites`, `scene.status` (nutzt `progress.completed/total`), `group.control`, `group.status`, `quick.actions`. Alle bauen ausschließlich auf `GlassCard`, `IconButton`, `SegmentedControl`, `PageTransition` – kein neues Styling.

## 7. UI (Design System)

- `src/routes/_app.scenes.tsx` – Bibliothek: Suche, Kategorie-Chips, Favoriten, „Zuletzt verwendet", Glass Grid mit Framer-Motion Stagger.
- `src/routes/_app.scenes.$sceneId.tsx` – Detail: Ausführung mit Progress (completed/total), Versionsliste, Restore, Export. Undo-Button wird gerendert, aber `disabled` mit Tooltip „vorbereitet" bis Teil 9/10.
- `src/routes/_app.scenes.$sceneId.edit.tsx` – Editor mit Drag & Drop (DnD-Hook aus dem Dashboard-Editor wiederverwenden), Aktions-Reihenfolge, Delay/Priority/errorStrategy, Geräte- und Gruppen-Picker.
- `src/routes/_app.groups.tsx` + `_app.groups.$groupId.tsx` – Gruppenbibliothek und -Editor. Editor erlaubt Auswahl von Kind-Geräten **und** Kind-Gruppen; ein Zyklus wird per Live-Validierung verhindert und mit klarer Fehlermeldung angezeigt.
- `src/components/scenes/*`, `src/components/groups/*` – nur Kompositionen bestehender DS-Komponenten (`GlassCard`, `GlassPanel`, `SegmentedControl`, `IconButton`, `PageTransition`, `HeroTransition`, `SharedLayout`).
- Bestehende Routen (`_app.rooms.$roomId`, `_app.devices.$deviceId`) bekommen neue Panels über die vorhandene `DevicePanelRegistry`/`RoomPanelRegistry`: Mitgliedschaften, Gruppen, verwendete Szenen, Quick Actions.

## 8. Import / Export

`sceneSerialization.ts` / `groupSerialization.ts` liefern versionsstabiles JSON (`schemaVersion`, `exportedAt`, `scenes[]`, `templates[]`, `groups[]`, `versions{}`). Import validiert per Zod und wählt `merge` | `replace`. Import berücksichtigt Templates und Versionen.

## 9. Vorbereitung Teil 9 (Automationen)

- `sceneAction.condition?: ConditionRef` bleibt typisiert (`unknown`) mit Namespace-Kommentar.
- Leere Registries unter `src/services/automations/`: `TriggerRegistry`, `ConditionRegistry`, `ActionRegistry` mit definierten Descriptor-Typen. Keine Ausführungslogik, keine Routen.
- `SceneParameterRegistry` ist bereits einsetzbar für spätere Automations-Parameter.

## 10. Performance & Accessibility

- Alle Listen: `React.memo`, `useMemo`-Selectors, stabile Keys, Slice-fähige Renderer als Virtualisierungs-Vorbereitung.
- Große Touchflächen (≥ 44 px), `aria-label`, `role="list"/"listitem"`, Fokusreihenfolge im Editor, Screenreader-Ansagen bei Execution-Statuswechsel und Progress-Updates.

## 11. Was **nicht** passiert

Keine Zeitpläne, Kalender, Geofencing, Benachrichtigungen, Historie, Diagramme, keine Automationen. **Keine Änderungen an der Command Queue oder der Universal Control Engine** – alle Erweiterungen laufen über bestehende Registries, Stores und Event-Kanäle.

```text
Scene UI ──▶ SceneManager ──▶ SceneExecutor ──▶ CommandQueue ──▶ wsManager
Group UI ──▶ GroupManager ──▶ GroupExecutor ──▶ CommandQueue ──▶ wsManager
Templates ─▶ TemplateManager ─▶ SceneManager (instantiate)
Intelligence / Widgets / Rooms lesen ausschließlich Stores
```

Ergebnis: versionierte Szenen mit Parameter- und Template-Vorbereitung, verschachtelte Gerätegruppen mit Zyklenerkennung, Progress- und Undo-Vorbereitung, komplette Bibliothek + Editor, Room/Device/Dashboard-Integration und Quick Actions – ausschließlich über vorhandene Registry-, Store- und Event-Architektur.
