
# Teil 11 von 18 — Event Center

Vollständig generisches Event Center als Aufsatz auf der Timeline-Plattform (Teil 10). Kein paralleles Notification-System: jede Notification ist eine Timeline-Quelle über `TimelineSourceDescriptor`, alle Farben/Icons kommen aus `SeverityRegistry` und `EventCategoryRegistry`. Der bestehende `notificationsStore` (aus Onboarding) und `TimelineSourceKind = "notification"` (Platzhalter aus Teil 10) werden zum vollwertigen System ausgebaut, nicht ersetzt.

## 1. Datenmodelle (`src/models/`)

### 1.1 `notification.ts` (erweitert, nicht ersetzt)
Bestehendes `AppNotification` wird ergänzt (alle neuen Felder optional, `NotificationSeverity` bleibt als Alias erhalten für Rückwärtskompatibilität, intern aber auf `Severity` gemappt):

```ts
uuid: string;
category?: EventCategory;
severity: Severity;            // ersetzt intern NotificationSeverity, alt bleibt kompatibel
priority?: 'low' | 'normal' | 'high' | 'urgent';
icon?: string; color?: string;
refType?: 'device'|'room'|'scene'|'automation'|'group'|'system'|'custom';
refId?: ID;
status?: 'active'|'resolved'|'dismissed';
acknowledged?: boolean; pinned?: boolean; archived?: boolean; favorite?: boolean;
tags?: string[];
actions?: NotificationAction[];
custom?: Record<string, unknown>;
userId?: ID;                    // Vorbereitung Teil 12 (Benutzerbindung)
templateId?: string;
```

- `NotificationAction`: `{ id; label; icon?; kind: 'navigate'|'run-scene'|'run-automation'|'open-device'|'open-room'|'open-group'|'open-log'|'custom'; target?; payload? }`
- `NotificationRule`, `NotificationTemplate`, `NotificationPreferences` als neue Modelle (`src/models/notificationRule.ts`, `notificationTemplate.ts`, `notificationPreferences.ts`).

### 1.2 Regeln (Vorbereitung, kein Runtime-Enforcement über Push)
`NotificationRule` — quietHours, muteCategories, muteSeverityBelow, mutedRefs (device/room/group/automation/user IDs), enabled. Rein Datenmodell + Auswertungsfunktion `matchesRule(notification, rule): boolean`.

### 1.3 Templates
`NotificationTemplate` — id, title/description-Templates mit `{{placeholders}}`, defaultSeverity, defaultCategory, defaultActions, refType.

## 2. Registries & Manager (`src/services/notifications/`)

Bestehende Muster (WidgetRegistry, SceneRegistry, AutomationRegistry) 1:1 übernehmen:

- `NotificationRegistry` — Registry für **Producer-Descriptoren**: `{ id, label, category, defaultSeverity, subscribe(emit) }`. Producer sind die Punkte, an denen Domänen (Automations, Discovery, Scenes, Groups, System) Notifications erzeugen. Kein Switch/If — der Manager iteriert über Descriptoren.
- `NotificationTemplateRegistry` — Descriptor-Tabelle, `render(templateId, data): AppNotification`.
- `NotificationRuleEngine` — reine Auswertungsschicht über `notificationRulesStore`. Filtert eingehende Notifications (drop/soften), verändert nichts an der Timeline-Persistenz.
- `NotificationManager` — Fassade: `push(input)`, `markRead`, `markAllRead`, `pin`, `archive`, `favorite`, `acknowledge`, `remove`, `runAction(notification, actionId, router)`. Schreibt in `notificationsStore` **und** emittiert einen `TimelineEntry` über den registrierten Timeline-Source-Adapter.
- `EventCenter` — Orchestrator; startet bei Bootstrap, sammelt Producer, verbindet mit TimelineSourceRegistry, hält Preferences.

## 3. Timeline-Integration (Erweiterungspunkt-Garantie)

- Aktivierung des in Teil 10 vorbereiteten `notificationTimelineSource` (Descriptor bereits vorhanden, `enabled: true` schalten).
- Der Source-Adapter mapped `AppNotification -> TimelineEntry` (source: `"notification"`, category/severity aus der Notification, refId/refType übernommen, sourceVersion gesetzt).
- Keine zusätzlichen Switch/If in der Timeline-Engine. Neue Ereignisquellen (später) registrieren sich weiterhin nur über `TimelineSourceRegistry`.

## 4. Stores (`src/store/slices/`)

- `notificationsStore` (vorhanden) — erweitert um: byId-Map (O(1)), Indexe nach category/severity/refId/pinned/favorite/archived/unread; Selectors `selectUnreadCount`, `selectCritical`, `selectByRoom`, `selectByDevice`, `selectPinned`, `selectFavorites`, `selectArchived`. Ringpuffer bleibt bei 200, wird konfigurierbar.
- `notificationRulesStore` — Rules + `activeRuleId`, Import/Export-fähig.
- `notificationTemplatesStore` — Templates, Import/Export.
- `notificationPreferencesStore` — global Preferences (Ruhezeiten, Toast-Verhalten, Badge-Verhalten, Filter). Bestehende Settings in `settingsStore.notifications` bleiben; neue Preferences ergänzen, alte Keys werden weitergelesen.

Alle Stores mit memoized Selektoren, O(1)-Lookups.

## 5. Toast-System (`src/components/notifications/`)

- `ToastHost` — global gemountet in `__root.tsx` neben bestehendem `<Toaster />` (sonner bleibt für Ad-hoc-UI-Toasts; das Event-Toast-System zeigt **nur** Notifications, die Preferences erlauben).
- `NotificationToast` — Glass-Design (GlassCard/GlassPanel), Framer-Motion (`AnimatePresence`, `layout`, shared layout), severity-abhängige Farb-Tokens aus SeverityRegistry, Auto-Dismiss (Dauer priority-abhängig), Aktionen (rendern `NotificationAction`), `aria-live="assertive"` bei critical/error, sonst `polite`.
- Queue mit max. sichtbaren Toasts (Priorität-basiert, Stapeln), Pause bei Hover/Focus.

## 6. Inbox & Routen (`src/routes/`)

Neue Routen, ausschließlich Glass-Design und bestehende UI-Primitives:

- `/_app/inbox` — Hauptansicht mit Tabs: Alle, Ungelesen, Favoriten, Angeheftet, Archiv. Filter-Sheet: Kategorie (aus `EventCategoryRegistry`), Severity (aus `SeverityRegistry`), Zeitraum, Suche, Referenz-Typ. Virtualisiert.
- `/_app/inbox/$notificationId` — Detailansicht: Quelle, Zeit, Referenz (Link zu device/room/scene/automation/group), Beschreibung, eingebettete Timeline (gefiltert auf `refId`), Aktionen (Quick Actions), Zusammenhang (verwandte Einträge).
- `/_app/settings/notifications` (vorhanden) — erweitert um Ruhezeiten, Kategorien-/Severity-Filter, Regel-Verwaltung, Templates. Alte Rows bleiben.

Bottom-Nav / `_app.more.tsx`: Eintrag „Ereignisse" mit Badge (Ungelesen-Anzahl).

## 7. Quick Actions

`NotificationActionExecutor` — kennt die generischen Kinds und delegiert an bestehende Manager:
- `navigate` → `router.navigate({ to: target })`
- `open-device`/`open-room`/`open-group`/`open-scene`/`open-automation` → typisierte Routen
- `run-scene` → `SceneManager.run(id, ctx)`
- `run-automation` → `AutomationManager.trigger(id, ctx)`
- `open-log` → `/timeline?refId=...`
- `custom` → registrierbarer Handler via `NotificationRegistry.registerActionHandler(kind, fn)`

## 8. Widgets (`src/services/widgets/builtin/notifications.tsx`)

Registriert via `WidgetRegistry.register(...)`:
- `notification.center` — kompakte Inbox
- `notification.unread` — Zähler
- `notification.critical` — kritische Ereignisse
- `notification.warnings` — Warnungen
- `notification.recent` — letzte N
- `notification.pinned` — angeheftete
Alle konsumieren Store-Selectors, keine eigene Datenlogik.

## 9. Integration in bestehende Domänen

Über **Producer-Descriptoren** (Notification Registry), keine Sonderpfade:

- `automationNotificationProducer` — hört auf `AutomationEvents` (executed/failed), erzeugt Notifications über Templates.
- `discoveryNotificationProducer` — Discovery-Status-Ereignisse.
- `deviceNotificationProducer` — offline/online/error via bestehende Device-Events.
- `sceneNotificationProducer`, `groupNotificationProducer` — Ausführungsergebnisse/Fehler.
- `systemNotificationProducer` — WebSocket-Status, App-Lifecycle.

Producer sind rein optional-abonnierbar; Producer-Descriptoren registrieren sich zentral in `bootstrap.ts`. Room-/Device-/Automation-Detailseiten binden Store-Selectors (`selectByRoom(id)` etc.) und zeigen bestehende Karten — keine Änderung an deren Datenpfad.

## 10. Import / Export

`src/services/notifications/serialization.ts` — JSON-Export/-Import für Preferences, Rules, Templates. Fügt sich in bestehende Backup-Route ein.

## 11. Vorbereitung Teil 12 (Benutzer)

- `AppNotification.userId?` und `NotificationRule.userId?` optional.
- `NotificationManager.push` akzeptiert optional `userId` (falls in Zukunft gesetzt).
- `notificationsStore`-Selectors erhalten optionalen `userId`-Filter.
- Keine Auth-, keine Rollenlogik in diesem Teil.

## 12. Performance & Accessibility

- `React.memo`, memoized Selectors, virtualisierte Inbox-Liste, Lazy-Load der Inbox-Route.
- ARIA-Live-Region im ToastHost, `role="status"`/`role="alert"` je nach Severity.
- Touchflächen ≥ 44px, Fokus-Management in Detail-Sheets.

## 13. Bootstrap

`src/services/bootstrap.ts`: Registrierung der Producer-Descriptoren, Aktivierung `notificationTimelineSource`, Start `EventCenter`, `stopEventCenter()` im Lifecycle.

## 14. Nicht enthalten

Kein Push, keine Cloud, kein E-Mail, kein SMS, keine externe Dienste, keine Auth. Kein Ersatz für sonner (bleibt für UI-Toasts). Kein neuer WebSocket-Kanal.

## 15. Erweiterungspunkt-Garantie

Neue Ereignisquellen kommen ausschließlich über:
1. `TimelineSourceRegistry.register(descriptor)` (falls eigene Timeline-Quelle) und/oder
2. `NotificationRegistry.registerProducer(descriptor)` (falls Notifications erzeugt werden).

Kein Code in Manager, Store, Toast, Inbox oder Widgets muss dafür geändert werden.

## Technische Details

- `NotificationSeverity` (alt) bleibt exportiert als Alias auf `Severity`-Teilmenge; Migration in Store transparent (`"info"|"success"|"warning"|"error"` unverändert, `"critical"` neu unterstützt).
- `notificationsStore.push` ruft intern `NotificationManager.push`; direkter Store-Aufruf bleibt kompatibel, wird aber via Wrapper an Manager delegiert.
- Timeline-Adapter für Notifications ist **die einzige** Stelle, die Notifications in die Timeline schreibt — kein Domain-Code emittiert Timeline-Einträge parallel.
- Rules werden vor `push` ausgewertet; abgelehnte Notifications können optional dennoch als Timeline-Eintrag (severity `info`) archiviert werden (per Preference).
- Refactoring erlaubt: Konsolidierung von `settingsStore.notifications` in `notificationPreferencesStore` möglich, alte Keys werden weitergelesen; keine bestehende Funktion entfällt.
