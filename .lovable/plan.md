
# Teil 12 von 18 — Benutzer, Profile, Rollen & Berechtigungen

Vollständig lokales System, aufgesetzt auf bestehende Registries, Stores und das Design System. Keine Cloud, keine Auth-Server, kein OAuth, kein 2FA. Kein Parallelmodell — bestehende `usersStore`, `User`-Model und die in Teil 11 vorbereiteten `userId?`-Felder werden ausgebaut, nicht ersetzt.

## 1. Datenmodelle (`src/models/`)

### 1.1 `user.ts` (erweitert, nicht ersetzt)
`User` bekommt optionale Felder — bestehende `{id, name, role, avatarUrl?, email?}` bleiben rückwärtskompatibel:
```ts
uuid: string;
firstName?: string; lastName?: string;
phone?: string; description?: string;
color?: HexColor; icon?: IconName;
language?: string; timezone?: string;
active: boolean; isGuest?: boolean; isAdmin?: boolean;
favorites?: FavoriteRef[];
custom?: Record<string, unknown>;
profileId?: ID; roleIds: ID[];
createdAt, updatedAt: Timestamp;
```
`UserRole` (alt: `"admin"|"user"|"guest"`) bleibt als String-Alias erhalten; intern über `roleIds` gepflegt, `role` wird als abgeleiteter Getter verfügbar (Migration transparent).

`FavoriteRef = { refType: 'device'|'room'|'scene'|'group'|'automation'|'dashboard'|'widget'; refId: ID }`.

### 1.2 Neue Modelle
- `profile.ts` — `Profile { id, name, icon, color, description?, defaultDashboardId?, homeRoute?, notificationPreferencesId?, themeId? }`.
- `role.ts` — `Role { id, key, name, description?, icon?, color?, builtin: boolean, permissions: PermissionGrant[] }`.
- `permission.ts` — `PermissionResource = 'device'|'room'|'group'|'scene'|'automation'|'dashboard'|'widget'|'notification'|'timeline'|'analytics'|'history'|'settings'|'user'`; `PermissionAction = 'read'|'control'|'edit'|'delete'|'manage'`; `PermissionGrant = { resource; action; scope?: 'all'|'own'|'shared'|{ refIds: ID[] } }`.
- `userPreferences.ts` — `{ userId, themeId?, dashboardId?, homeRoute?, widgetLayoutId?, favorites, recentPages, notificationPreferencesId?, language?, units?, animations?, accessibility? }`.
- `ownership.ts` — generisches Sharing: `Ownership { refType, refId, ownerUserId, memberUserIds, guestUserIds?, sharedRoleIds?, editorUserIds? }`.

Anpassung bestehender Modelle (nur optionale Felder, keine Pflichtfelder):
- `Room`: `ownerUserId?`, `memberUserIds?`, `guestUserIds?`.
- `Device`: `ownerUserId?`, `visibleToUserIds?`, `controlUserIds?`, `favoriteUserIds?`.
- `Scene`, `DeviceGroup`, `Automation`: `ownerUserId?`, `sharedUserIds?`, für Automation zusätzlich `editorUserIds?`.
- `AppNotification`, `TimelineEntry`, `NotificationRule`: `userId?` (bereits vorhanden, unverändert genutzt).

## 2. Registries & Manager (`src/services/users/`)

Muster identisch zu `WidgetRegistry`/`SceneRegistry`/`NotificationRegistry`:
- `RoleRegistry` — Descriptor-basiert. Built-in Descriptors registrieren `admin`, `user`, `guest`, `technician`. `registerRole(descriptor)` für Custom. Keine Hardcodierung außerhalb der Descriptor-Datei.
- `PermissionRegistry` — Descriptor je `resource`, listet erlaubte `actions` und liefert `evaluate(user, roles, ownership, action, resource, refId?)`. Keine Switch-Kaskaden — alles über Descriptor.
- `ProfileRegistry` — Built-in Profile: Administrator, Familie, Kinder, Gast, Techniker. Custom via Registry.
- `UserManager` — Fassade: `create`, `update`, `remove`, `setActive`, `setFavorite`, `setCurrent`, `assignRole`, `assignProfile`, `updateCustom`. Delegiert an `usersStore`.
- `ProfileManager` — CRUD über `profilesStore`, `applyProfile(userId)` setzt Preferences-Defaults.
- `UserPreferencesManager` — CRUD über `userPreferencesStore`, `getEffective(userId)` mergt Profile-Defaults + Overrides.
- `PermissionEvaluator` (reine Funktion) — zentraler Ausdruck `can(user, action, resource, refId?)`. Alle UI-Gates konsumieren nur diese Funktion. Für Teil 12 rein informativ (UI kann Elemente ausblenden), keine harten Sperren im Command-Pfad.

`OwnershipRegistry` — kleiner Descriptor je `refType`, der aus dem passenden Store (`roomsStore`, `devicesStore`, …) das Ownership-Objekt liefert. So kann `PermissionEvaluator` einheitlich auf beliebige Ressourcen zugreifen, ohne einen Switch.

## 3. Stores (`src/store/slices/`)

Alle mit `byId`-Map (O(1)), memoized Selectors, `persistentStorage()`:

- `usersStore` (vorhanden) — erweitert um `byId`, `selectActive`, `selectAdmins`, `selectGuests`, `selectByRoleId`, `selectFavoritesOf`, `addFavorite`, `removeFavorite`, `setCurrentUserId`. Alte API (`users`, `currentUser()`) bleibt.
- `profilesStore` (neu) — CRUD, Selectors, Import/Export.
- `rolesStore` (neu) — persistiert nur Custom/Overrides; Built-ins kommen aus `RoleRegistry` und werden beim Lesen gemerged.
- `permissionsStore` (neu) — persistierte Overrides pro User/Role/Resource; Grants aus Roles sind Basis.
- `userPreferencesStore` (neu) — pro `userId` Preferences; Selectors `selectFavorites(userId)`, `selectRecentPages(userId)`, `selectEffective(userId)`.

Bestehende Stores (`roomsStore`, `devicesStore`, `scenesStore`, `groupsStore`, `automationsStore`) bekommen zusätzliche Selectors (`selectByOwner(userId)`, `selectSharedWith(userId)`, `selectVisibleFor(userId)`), keine Änderung an der Grundstruktur.

## 4. UI & Routen (`src/routes/`)

Ausschließlich vorhandenes Design System (`GlassCard`, `HeroCard`, `SectionCard`, `StatusBadge`, `SharedLayout`, `PageTransition`, `BottomSheet`):

- `/_app/users` — Liste mit Hero (Aktueller Benutzer), Filter (Aktiv/Gast/Admin), Suche. Card-Grid.
- `/_app/users/$userId` — Detail: Avatar, Rollen, Profil, Preferences-Übersicht, Favoriten, zugeordnete Räume/Geräte/Szenen/Automationen (über neue Store-Selectors), User-spezifische Timeline (Filter über `timelineStore` `userId`), User-spezifische Notifications (bereits vorhanden).
- `/_app/users/$userId/edit` — Form (Name, Vorname, Nachname, Avatar, E-Mail, Telefon, Beschreibung, Farbe, Icon, Sprache, Zeitzone, Aktiv/Gast/Admin, Rollen, Profil, Custom-Props).
- `/_app/profiles` — Profile-Liste + Detail-BottomSheet.
- `/_app/roles` — Rollen-Liste; Built-in read-only mit Badge, Custom editierbar. Permission-Matrix (Resource × Action) über generische Tabellen-Component.
- `/_app/permissions` — Übergeordnete Übersicht (User → effektive Grants); rein informativ, keine Auth-Sperre.

Bestehende Route `/settings/users` bleibt und verlinkt auf `/users` (kein Bruch). `_app.tsx`: keine Änderung an Redirect-Logik (Onboarding-Gate bleibt).

**Widgets** über `WidgetRegistry.register` in `src/services/widgets/builtin/users.tsx`:
- `user.current`, `user.switcher`, `user.quick-profiles`, `user.family-overview`. Alle konsumieren nur Store-Selectors.

## 5. Integration in bestehende Domänen

Rein **datenmodell-basiert**. Keine Änderung an Command-Pfad, Discovery, WebSocket, Automation Executor.
- Room-/Device-/Scene-/Group-/Automation-Detailseiten bekommen einen kleinen „Zuständigkeit"-Abschnitt (`Owner`, `Mitglieder`, `Gäste`, `Freigaben`), gerendert über die neuen Selectors.
- Dashboard: `useRuntimeDashboard` bekommt einen optionalen `userId`-Parameter (aus `usersStore.currentUserId`), damit `/dashboards` das benutzerspezifische Default-Dashboard aus `userPreferencesStore` auflösen kann. Kein Zwang — ohne aktuellen Benutzer bleibt Verhalten unverändert.
- `NotificationManager.push` und `EventCategoryRegistry`-Producer werden ergänzt, `userId` optional durchzureichen (bereits vorbereitet).
- `TimelineSourceRegistry`-Sources bekommen einen optionalen `userId`-Passthrough; keine neue Source, kein Switch.

## 6. Import / Export

`src/services/users/serialization.ts` — JSON mit `schemaVersion`, Merge/Replace-Strategie. Umfasst Users, Profiles, Roles (nur Custom), Permission-Overrides, Preferences. Fügt sich in `services/storage/backup.ts` ein (neuer Namespace `users`).

## 7. Vorbereitung Teil 13 (globale Suche)

- `userPreferencesStore.recentPages` mit generischer Struktur `{ ref, timestamp }` — Suche kann später darauf zugreifen.
- `favorites` einheitlich als `FavoriteRef[]` — Suche kann filtern.
- `PermissionEvaluator.can(...)` — Suche kann Ergebnisse filtern.
- Kein Suchsystem, keine Suchindexe, keine Routen dafür.

## 8. Performance & Accessibility

- `React.memo` auf Listen-Items, memoized Selectors, `byId`-Lookups.
- Lazy-Loading der User-/Rollen-/Profil-Routen.
- Fokus-Management in BottomSheets, ARIA-Labels, ≥ 44 px Touchflächen, Framer-Motion `SharedLayout` für Detail-Übergänge.

## 9. Bootstrap (`src/services/bootstrap.ts`)

- Registrierung der Built-in Roles + Profiles beim App-Start.
- Anlegen eines Default-Admin-Users, wenn `usersStore.users` leer ist (Migration bestehender Sessions ohne Users).
- `UserManager`/`ProfileManager`/`UserPreferencesManager` als Singletons instanziieren.
- Kein neuer Lifecycle-Hook nötig; passt sich in bestehende `bootstrap()`-Sequenz ein.

## 10. Nicht enthalten

Kein Login, keine Passwörter, kein OAuth/LDAP/Google/Microsoft, kein 2FA, keine Cloud-Sync. Kein Auth-Middleware, kein Route-Guard mit Redirect. Berechtigungen sind rein UI-informativ.

## 11. Erweiterungspunkt-Garantie

Neue Rollen: `RoleRegistry.registerRole(descriptor)`. Neue Ressourcen: `PermissionRegistry.registerResource(descriptor)` + `OwnershipRegistry.registerOwnershipSource(descriptor)`. Neue Widgets: `WidgetRegistry.register`. Kein Manager-, Store- oder UI-Code muss dafür geändert werden.

## Technische Details

- Migration `usersStore`: bestehender `role: UserRole` bleibt lesbar; beim ersten Lauf wird auf `roleIds: [<matching-builtin-role-id>]` gemappt, `role` als abgeleiteter Getter (String) bleibt für Rückwärtskompatibilität exportiert.
- Bestehende Detailseiten (`_app.rooms.$roomId`, `_app.devices.$deviceId`, …) werden nur um einen Ownership-Abschnitt ergänzt; kein bestehender Code entfernt.
- `PermissionEvaluator` ist pure; Ergebnis kann memoisiert per `useMemo(user, action, resource, refId)` in Components genutzt werden.
- `Ownership` wird **nicht** als separater persistierter Store gehalten; Descriptoren lesen aus den vorhandenen Domain-Stores. So entstehen keine Sync-Probleme.
- Refactoring erlaubt: `settingsStore` bleibt unverändert; nur ergänzende Selectors, keine Datenverschiebung.

