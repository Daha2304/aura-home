## Teil 6A.5 — Smart Home Intelligence Layer

Neue Service-Ebene `src/services/intelligence/` als zentrale Rechenschicht. Keine Änderung bestehender Architektur — nur zusätzliche Services, Stores, Events. Widgets/Komponenten/Stores rechnen nicht mehr selbst.

### 1. Verzeichnisstruktur

```text
src/services/intelligence/
  index.ts                       Public API + bootstrap()
  IntelligenceController.ts      Orchestrator, abonniert device/room/discovery events
  aggregation/
    RoomAggregator.ts            pro Raum: Metrics berechnen (inkrementell)
    HouseAggregator.ts           gesamtes Haus
    MetricContributors.ts        Plugin-Registry (contributor pattern)
    contributors/
      countContributor.ts        Geräteanzahl, online/offline/warn/fav
      climateContributor.ts      temp/humidity/co2/voc/airQuality (avg)
      openingsContributor.ts     Fenster/Türen offen
      lightingContributor.ts     Lampen aktiv
      outletContributor.ts       Steckdosen aktiv
      shadingContributor.ts      Rolläden
      climateControlContributor.ts Heizung/Klima aktiv
      mediaContributor.ts        Medien aktiv
      energyContributor.ts       power/energy sum, PV, wallbox
      healthContributor.ts       battery/signal avg
      activityContributor.ts     lastSeen max, discovery/sync
  status/
    RoomStatusEngine.ts          normal/warn/error/offline/sync/discovery/empty
    HouseStatusEngine.ts
  assignment/
    DeviceAssignmentEngine.ts    move device room/group/floor/virtual
  filter/
    DeviceFilterEngine.ts        composable predicates (room/cat/type/online/…)
    filters/*.ts                 pluginfähige Einzelfilter
  search/
    SearchEngine.ts              tokenized, alias/synonyms, cross-entity
    SearchIndex.ts               inverted index (Map<token,Set<id>>)
    synonyms.ts
  insights/
    RoomInsightsEngine.ts        rendert Metrics → Insight[]
    HouseInsightsEngine.ts
    InsightTypes.ts
  cache/
    MemoCache.ts                 keyed memo (revision+roomId)
    Selectors.ts                 reselect-artige createSelector
  events/
    IntelligenceEvents.ts        typed EventEmitter (roomMetricsUpdated, …)
  types.ts                       RoomMetrics, HouseMetrics, RoomStatus, Insight
```

### 2. Neue Modelle (`src/models/`)

- `roomMetrics.ts` — `RoomMetrics` interface (alle im Prompt genannten Felder, alle optional außer counts).
- `houseMetrics.ts` — `HouseMetrics`.
- `roomStatus.ts` — `type RoomStatus = "normal"|"warning"|"error"|"offline"|"syncing"|"discovering"|"empty"`.
- `insight.ts` — `Insight { id, scope: "room"|"house", roomId?, kind, label, value, icon?, severity? }`.
- `intelligenceEvents.ts` — Event-Namen als Konstanten + Payload-Typen.

### 3. Neue Stores (`src/store/slices/`, nur Vorbereitung)

- `roomMetricsStore.ts` — `Map<roomId, RoomMetrics>`, `revision`, `setRoom`, `patchRoom`, `byId`.
- `houseMetricsStore.ts` — `HouseMetrics | null`, `set`, `revision`.
- `insightsStore.ts` — `Map<scopeKey, Insight[]>`.
- `assignmentStore.ts` — pending assignments queue (später mit Command Queue verknüpfbar).

Alle mit O(1) `Map`-Index; Selektoren memoisiert.

### 4. Contributor-Pattern (Plugin-System)

```ts
interface MetricContributor {
  id: string;
  contribute(ctx: { device: Device; acc: MutableRoomMetrics }): void;
  reset?(acc: MutableRoomMetrics): void;
  finalize?(acc: MutableRoomMetrics): void; // averages
}
```

`MetricContributors.register(c)` — neue Gerätetypen fügen einfach neue Contributor hinzu; Aggregatoren iterieren blind über die Registry. Damit: **keine** Aggregator-Änderung bei neuen Device-Types.

### 5. Inkrementelle Berechnung

`IntelligenceController` abonniert:
- `devicesStore` (via zustand subscribe — vergleicht `revision` und diffed `index`)
- `roomsStore`
- `DiscoveryEvents`, `RoomEvents`

Bei Device-Update: nur betroffenen Raum (alt+neu) neu berechnen → `RoomAggregator.recompute(roomId)`. HouseAggregator aggregiert über RoomMetrics (nicht über alle Devices erneut). Ergebnisse werden in Stores geschrieben + Event emittiert.

### 6. Status-Engine

`RoomStatusEngine.derive(metrics, room, discovery)` → deterministischer Status. Priorität: error > offline > warning > syncing > discovering > empty > normal.

### 7. Assignment-Engine

`DeviceAssignmentEngine.assign(deviceId, { roomId?, groupIds?, floor?, virtualRoomId? })`
- validiert
- mutiert `devicesStore` (upsertDevice) und ggf. `roomsStore`
- triggert Recompute alter + neuer Raum
- emittet `deviceAssigned`/`deviceUnassigned`

### 8. Filter- & Search-Engine (nur vorbereitet)

- Filter: `DeviceFilterEngine.apply(devices, criteria)` mit pluginbaren Prädikaten (`registerFilter`).
- Search: `SearchIndex` baut invertierten Index über Devices/Rooms/Dashboards/Widgets/Scenes/Automations/Tags/Aliases. Synonym-Map (`de` initial leer/Skeleton).

### 9. Insights

`RoomInsightsEngine.build(roomId)` transformiert Metrics + Status in Liste kurzer, UI-fertiger `Insight`-Objekte (Text kommt aus einem `InsightFormatter`, i18n-ready via bestehendem `services/i18n`).

### 10. Events

Neues Emitter-Modul `IntelligenceEvents` (nutzt `services/events/EventEmitter`):
`roomMetricsUpdated`, `houseMetricsUpdated`, `roomStatusChanged`, `deviceAssigned`, `deviceUnassigned`, `aggregationUpdated`, `insightUpdated`.

### 11. Bootstrap

`src/services/bootstrap.ts` erweitern: nach Registry/Rooms Init → `intelligence.bootstrap()` (registriert Standard-Contributors, abonniert Stores, initiale Voll-Berechnung).

### 12. Caching / Performance

- `MemoCache` keyed auf `(roomId, devicesRevision, roomsRevision)`.
- Aggregator hält mutable Akkumulatoren pro Raum, tauscht nur bei Änderung.
- HouseMetrics = Reduktion über RoomMetrics-Map, nicht über Devices.
- Selektoren mit strukturellem Sharing für Zustand-Konsumenten.

### 13. Nicht enthalten

Keine UI-Anbindung, keine Widgets ändern, keine Devices/Scenes/Automations-Features, keine Charts.

### 14. Verifikation

- `bunx tsgo --noEmit`
- Kurzer Smoke: In DevTools `intelligence.debug.snapshot()` liefert leere RoomMetrics für alle bestehenden Räume (keine Devices vorhanden) ohne Fehler.

Bereit zur Umsetzung — bei Freigabe implementiere ich alle o. g. Dateien in einem Batch.