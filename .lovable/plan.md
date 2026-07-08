## Ziel

Teil 3/15: Aufbau einer vollständigen Device-Registry, Discovery-Engine, Lifecycle-, Relationship-, Cache- und Command-Queue-Architektur. Rein architektonisch — **keine UI-Änderungen, keine sichtbaren Geräte**. Bestehende Services (`wsManager`, `MessageDispatcher`, `deviceManager`, `errorBus`, `Logger`, Stores) werden **erweitert, nicht ersetzt**.

## Neue Ordnerstruktur

```text
src/models/
  deviceType.ts          # DeviceTypeId (Union der 36 Typen)
  deviceCategory.ts      # Kategorien (lighting, climate, security, ...)
  deviceCapability.ts    # CapabilityFlag Union (supportsPower, ...)
  deviceLifecycle.ts     # LifecycleState + Transitions
  deviceProfile.ts       # DeviceProfile (Hersteller, MAC, UUID, ...)
  deviceRelationship.ts  # RelationshipKind + DeviceRelationship
  command.ts             # Command, CommandState, CommandResult
  discoveryEvents.ts     # Discovery-Event-Union

src/services/registry/
  DeviceRegistry.ts      # zentrale Registry (Map<DeviceTypeId, Descriptor>)
  DeviceTypeDescriptor.ts# Beschreibungsobjekt eines Gerätetyps
  builtin/index.ts       # Registrierung aller 36 Built-in-Typen
  builtin/lighting.ts    # light, rgb, dimmer
  builtin/covers.ts      # blinds, jalousie, awning, garage
  builtin/openings.ts    # door, window, doorContact, windowContact
  builtin/sensors.ts     # motion, presence, temp, humidity, pressure, co2, voc, smoke, water
  builtin/climate.ts     # thermostat, heating, ac, fan
  builtin/media.ts       # tv, avr, speaker, mediaPlayer
  builtin/security.ts    # camera, doorbell, alarm
  builtin/energy.ts      # energyMeter, pv, battery, wallbox
  builtin/misc.ts        # outlet, vacuum, custom

src/services/discovery/
  DiscoveryEngine.ts     # ersetzt Stub, nutzt wsManager.dispatcher
  DiscoveryEvents.ts     # typisierter TypedEmitter<DiscoveryEventMap>
  DeviceSync.ts          # Full/Delta/Partial-Sync + Konflikte + Versionen
  LifecycleMachine.ts    # deterministischer FSM pro Gerät
  RelationshipGraph.ts   # bidirektionaler Graph (parent/child, group, bridge)
  DeviceCache.ts         # localStorage-Cache, versioniert, mit Migrationen
  Validators.ts          # ID/Type/Firmware/Capabilities-Prüfungen
  index.ts

src/services/commands/
  CommandQueue.ts        # persistent + in-memory, State-Machine pro Command
  CommandTracker.ts      # optimistic updates + Rollback-Snapshots
  index.ts

src/store/slices/
  registryStore.ts       # veröffentlicht Registry-Snapshot reaktiv (read-only)
  discoveryStore.ts      # discoveryState, letzte Events, Sync-Info
  commandsStore.ts       # laufende/erledigte Commands
  devicesStore.ts        # erweitert um O(1)-Index-Map, Selektoren, Version
```

## Device Registry (Plugin-Prinzip)

`DeviceTypeDescriptor`:

```ts
{
  id: DeviceTypeId;              // "light", "rgb", "wallbox", ...
  name: string;                  // "Licht"
  category: DeviceCategory;      // "lighting"
  icon: IconName;                // Lucide-Name als String
  color: HexColor;
  capabilities: CapabilityFlag[];// deklarative Fähigkeiten
  functions: DeviceFunctionKind[];
  defaultWidgets: WidgetType[];  // vorbereitet, noch nicht sichtbar
  control?: string;              // Slug, später von einer Control-Registry aufgelöst
  detail?: string;               // Slug für Detailview
  charts?: ChartKind[];          // vorbereitet
}
```

`DeviceRegistry` (Singleton):
- `register(desc)` / `unregister(id)` / `get(id)` / `all()` / `byCategory(cat)`
- `getCapabilities(id)`, `hasCapability(id, flag)` — O(1) via `Map`
- Built-ins werden in `builtin/index.ts` einmalig registriert (Side-Effect-Import), sind aber vollständig plugin-fähig: neue Typen kommen via `deviceRegistry.register(...)` dazu, **ohne bestehende Komponenten anzufassen**.
- Doppelregistrierung → `errorBus.report({ kind: "invalid_message" })`, kein Throw.

## Capabilities-System

`CapabilityFlag`-Union enthält die vom User genannten Flags (`supportsPower`, `supportsBrightness`, `supportsRGB`, `supportsColorTemperature`, `supportsPosition`, `supportsTilt`, `supportsEnergy`, `supportsBattery`, `supportsSignal`, `supportsHistory`, `supportsNotifications`, `supportsOTA`, `supportsGroups`, `supportsTimers`, `supportsScenes`, `supportsAutomation`, `supportsStatistics`, `supportsFirmware`, `supportsChildDevices`, `supportsMultipleFunctions`).

Helper:
- `hasCapability(device, flag)` — kombiniert Registry-Default + geräteseitiges Override (`device.capabilityFlags?`).
- Existierende strukturierte `Capability`-Union (`onOff`, `dimmer`, ...) bleibt **unverändert** — Flags sind ein orthogonales, deklaratives System, damit die UI später automatisch generiert werden kann.

## Device-Profile

`Device` bekommt (additiv, alle optional — bricht keine bestehenden Konsumenten):

```ts
uuid?, serial?, mac?, hardwareVersion?, softwareVersion?, floor?,
image?, tags?, description?, customProperties?, capabilityFlags?,
lifecycle?: LifecycleState, version?: number, relationships?: DeviceRelationship[]
```

## Lifecycle-Machine

`LifecycleState`: `new → initializing → discovering → ready → updating → offline → error → removing → removed`.
`LifecycleMachine.transition(from, to)` erzwingt gültige Übergänge; ungültige gehen an den `errorBus`. Zustand wird in `Device.lifecycle` gespiegelt.

## Relationships

`RelationshipKind`: `group | master | slave | child | parent | gateway | bridge | room | zone | virtual`.
`RelationshipGraph` (bidirektional, `Map<id, Set<Edge>>`):
- `link(a, b, kind)`, `unlink(a, b)`, `children(id)`, `parents(id)`, `related(id, kind?)`, `groupsOf(id)`.
- Zyklen für `child/parent` werden erkannt und blockiert.

## Discovery-Engine

`DiscoveryEngine` (Singleton `discoveryEngine`):
- Abonniert **beim Start** den `wsManager.dispatcher` und den `wsManager`-Statusstream.
- Emittiert typisierte Events: `deviceDiscovered | deviceInitialized | deviceReady | deviceUpdated | deviceOnline | deviceOffline | deviceCapabilitiesChanged | deviceFunctionAdded | deviceFunctionRemoved | deviceRemoved | discoveryStarted | discoveryFinished | syncStarted | syncFinished`.
- Ruft `deviceRegistry`, um unbekannte Typen zu erkennen (`invalid_device_type`).
- Validiert jedes eingehende Gerät via `Validators` (ID vorhanden, Typ registriert, Duplikat, Firmware-Kompatibilität, Capabilities gültig).
- Reihenfolge pro Gerät: `validate → resolveType → mergeIntoRegistryDefaults → runLifecycle → upsertStore → emit`.
- Bricht bestehenden `deviceManager` **nicht** — der `deviceManager` delegiert seine `device.*`-Handler an die Discovery-Engine; der Store bleibt die single source of truth.

## Synchronisation & Versionierung

`DeviceSync`:
- `fullSync(devices[])` — Snapshot vom Server, ersetzt Registry-Inhalte im Store, respektiert lokale Overrides (favorite, roomId, tags) via `mergePolicy`.
- `deltaSync(patch)` — `{ added, updated, removed }`.
- `partialUpdate(deviceId, patch, version)` — Version-Check, verwirft veraltete Patches, ruft bei Konflikt `errorBus`.
- `Device.version` wird bei jeder Änderung inkrementiert (monoton, lokal), Server-Version separat als `serverVersion`.

Konflikterkennung: Wenn `patch.baseVersion < currentVersion` und geänderte Felder überlappen → `sync_conflict`-Event + Fallback auf Server-Wert.

## Device-Cache

`DeviceCache`:
- Persistiert `{ schemaVersion, devices, groups, relationships, updatedAt }` in `localStorage` unter `smarthome.cache.devices`.
- `hydrate()` beim Start → sofortiges Restore in `devicesStore` (aber UI zeigt nach wie vor keine Geräte an — es gibt keine Widgets, die darauf lesen).
- `persistDebounced()` bei Änderungen (250 ms).
- `schemaVersion`-Migrationen als Registry: `{ [from]: (state) => nextState }`.

## Command-Queue (Erweiterung des Kommunikationsstacks)

`CommandQueue` in `src/services/commands/`:
- Ersetzt **nicht** die existierende WS-Offline-Queue (die bleibt für rohe Nachrichten). Command-Queue ist eine Schicht darüber, mit Command-Objekten:

```ts
{ id, deviceId, key, value, state, attempts, createdAt, updatedAt, error?, correlationId }
```

- `state`: `queued → sending → sent → acknowledged → completed | failed | cancelled | retrying`.
- `enqueue(cmd)`, `cancel(id)`, `retry(id)`, `ack(id, result)`.
- Nutzt `wsManager.send({ type: "command", ..., requestId })` und wartet auf `device.state` oder ein `command.ack` (Protokoll-Adapter-Erweiterung vorbereitet, kein Server-Kontrakt hartcodieren).
- `CommandTracker` erzeugt vor `sending` einen **optimistic snapshot** des betroffenen Gerätefeldes, bestätigt bei `completed`, rollbackt bei `failed | timeout`.
- Timeout pro Command konfigurierbar (Default 5 s), Retry mit Backoff.

## Store-Erweiterungen

- `devicesStore`: interne `Map<id, Device>` für O(1)-Lookup neben `devices[]`; `byId(id)` wird auf Map umgestellt; neuer `version`-Zähler; neue Selektoren (`byType`, `byCapability`, `byCategory`, `byLifecycle`).
- Neu: `registryStore` (read-only Snapshot der Registry-Descriptors — reaktiv, damit UI später automatisch reagiert, wenn Plugins nachladen).
- Neu: `discoveryStore` (`state: idle | discovering | syncing | ready`, `lastSync`, `errors[]`, `stats`).
- Neu: `commandsStore` (aktive + historische Commands, gecapped).

Alle neuen Selektoren verwenden `useX(selector, shallow)` bzw. reine Getter, damit Re-Renders minimal bleiben.

## Discovery-Events (öffentlich)

Zentraler `discoveryEvents: TypedEmitter<DiscoveryEventMap>` — UI-Hooks können später eventbasiert reagieren, ohne den Store zu pollen. Der `DeviceManager` reemittiert seine bisherigen Callbacks über diesen Emitter, damit alles über **einen** Kanal läuft.

## Bootstrap-Verdrahtung

`src/services/bootstrap.ts` wird erweitert:
1. Built-ins registrieren (`import "@/services/registry/builtin"`) — einmalig, per Side-Effect.
2. `DeviceCache.hydrate()` vor WS-Connect.
3. `discoveryEngine.start()` nach `deviceManager.start()`.
4. `commandQueue.start()`.
5. Auf `wsManager.on("authenticated")` → `discoveryEngine.requestFullSync()` (versendet ein `request`-Message via `wsManager.send`, Operation-Slug bleibt konfigurierbar → keine Hardcodings).

## Fehlerbehandlung

Alle Validierungsfehler laufen über `errorBus` mit klaren `kind`s:
- `parse` (unlesbares Delta), `invalid_message` (fehlende ID/Typ), `server` (unbekannte Server-Fehler), `unknown` (Fallback).
Zusätzliche `code`s: `duplicate_device`, `unknown_device_type`, `invalid_capability`, `sync_conflict`, `firmware_incompatible`.

## Performance

- `Map<id, T>` überall statt `Array.find`.
- `Set<id>` für Beziehungen.
- Selektoren mit `shallow` in Zustand.
- Debounced Persist im Cache.
- Registry-Lookups sind konstantzeitlich.
- Keine Renderzyklen für UI ausgelöst — die UI liest weder Registry noch Discovery in diesem Teil (bewusst).

## Nicht-Ziele (Teil 3)

- Keine sichtbaren Geräte, Räume, Widgets.
- Keine Control-/Detail-Komponenten.
- Keine Diagramme.
- Keine Änderungen an bestehenden Routen/Screens außer nötigen Bootstrap-Aufrufen.

## Verifikation

- `bunx tsgo --noEmit` grün.
- Registry-Selbstcheck beim Boot: alle 36 Built-in-Typen laden ohne Fehler; Doppelregistrierung feuert `errorBus`.
- `DeviceCache` round-trip (`hydrate` nach `persist`) preserviert Struktur (später via kleinem Debug-Utility, keine UI).
