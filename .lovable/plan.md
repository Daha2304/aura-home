## Ziel

Vollständige First-Run-Experience: Willkommen → Server anlegen/wählen → Verbindungstest → Auth → Discovery → Sync → Weiterleitung zum Dashboard. Zusätzlich hochwertige Serververwaltung (CRUD, Duplizieren, Import/Export, Favorit, Autoconnect). Keine Geräte-, Raum- oder Dashboard-Inhalte.

Aufbauend auf bestehender Architektur (`useSettingsStore`, `WebSocketManager`, `DiscoveryEngine`, `wsManager.dispatcher`, `connectionStore`, `discoveryStore`, `useCommunicationLayer`, `GlassCard`/`GlassButton`, `themes/motion`). Nichts wird entfernt.

## Model-Erweiterungen (additiv, backward-compatible)

`src/models/server.ts`:
- `ServerAuth.type` erweitern um `"token" | "basic"` bleibt, zusätzlich Felder `description?`, `notes?`, `color?`, `icon?`, `image?`, `favorite?`, `lastConnectedAt?`, `createdAt`, `updatedAt` in `ServerConfig`.
- Alle neuen Felder optional → keine Bruchänderungen.
- Neue Helper: `createServerConfig(partial)` → generiert `id`, Timestamps.
- `validateServerConfig(cfg)` → strukturiertes `{ ok, errors: Record<field,string> }` für Live-Validierung (Host/Port/Path/Auth-Pflichtfelder).

## Neue Stores/Slices

`src/store/slices/onboardingStore.ts`:
- `completed: boolean` (persist), `currentStep`, `flow: "first-run" | "add-server" | null`, `draftServer?: Partial<ServerConfig>`, `lastError?`, Actions `start/next/prev/setDraft/complete/reset`.
- Persistiert nur `completed` in `localStorage` (Key `smarthome.onboarding`).

`useSettingsStore` erweitern: `duplicateServer(id)`, `toggleFavorite(id)`, `exportServers()`, `importServers(json, mode)`. Bestehende Actions bleiben.

## Services

`src/services/onboarding/OnboardingController.ts`:
- Orchestriert Test-Verbindung als asynchronen Zustandsautomaten:
  `idle → connecting → authenticating → discovery-prep → syncing → done | error`.
- Nutzt ausschließlich existierende Bausteine: `wsManager.setConfig()`, `wsManager.connect()`, subscribed auf `dispatcher` Events (`connected`, `authenticated`, `disconnected`, `error`) und auf `discoveryEvents` (`discoveryStarted`, `syncCompleted`).
- `runConnectionTest(cfg, { signal })` liefert Promise mit Phasenupdates via Callback / EventEmitter.
- Trennt "Test-Modus" (temporäre Config, kein Persist) von "Aktivierung" (Store-Commit → `setActiveServer`).
- Keine hardcodierten Credentials.

`src/services/onboarding/serverImportExport.ts`:
- `exportServers(list) → File-Blob (application/json)`, `parseImport(text)` mit Zod-artigem manuellen Validator (keine neue Dep, wenn zod schon vorhanden — sonst leichter Guard-basierter Parser via `utils/guards`).

## Routen (neu)

Neue Top-Level-Layout-Route außerhalb `_app`, damit kein `AppShell`/BottomNav sichtbar ist:

- `src/routes/onboarding.tsx` — Pathless Layout mit `<Outlet />`, Framer-Motion `AnimatePresence`, Gradient-/Blur-Hintergrund, Progress-Indicator (Steps).
- `src/routes/onboarding.index.tsx` → Redirect auf `/onboarding/welcome`.
- `src/routes/onboarding.welcome.tsx` — Hero + Logo + Buttons „Einrichtung starten" / „Konfiguration importieren".
- `src/routes/onboarding.intro.tsx` — 3 Slides (Geräte, Automationen, Privatsphäre).
- `src/routes/onboarding.server.tsx` — Serverliste (nutzt existing Servers) oder Auswahl „Neuen Server anlegen".
- `src/routes/onboarding.configure.tsx` — Mehrstufiges Formular mit Live-Validierung (Name/Host/Port/SSL/Path/Auth-Typ/Credentials/Optionen).
- `src/routes/onboarding.test.tsx` — Verbindungstest (nutzt `OnboardingController`), Live-Phasen mit Icons + Animation.
- `src/routes/onboarding.discovery.tsx` — Discovery-/Sync-Progress mit Statuskarten (Server erreichbar, authentifiziert, Discovery gestartet, Geräte erkannt, Sync abgeschlossen).
- `src/routes/onboarding.done.tsx` — Erfolgsscreen, CTA „Zum Dashboard".

Bestehendes `_app.settings.server.tsx` erweitern (nicht ersetzen):
- Vollständiges CRUD: Karten mit Status-Badge (aus `connectionStore`), Kontextmenü (Bearbeiten, Duplizieren, Löschen, Als Favorit, Exportieren), Header-Aktionen „Hinzufügen" / „Importieren".
- Bearbeiten/Neu → öffnet `/settings/server/edit/$id` bzw. `/settings/server/new` (neue Routen als Modal-Sheet).

Neue Sub-Routen:
- `src/routes/_app.settings.server.new.tsx`
- `src/routes/_app.settings.server.$id.tsx`

## Root-Redirect-Logik

`src/routes/_app.tsx` erweitern: nach `useCommunicationLayer()` frühzeitiger Redirect via `useEffect`:
- Wenn `!onboarding.completed` **und** `settings.servers.length === 0` → `navigate({ to: "/onboarding/welcome", replace: true })`.
- Wenn bereits Server + completed → normales Verhalten (Onboarding wird übersprungen).
Kein Bruch bestehender Navigation.

## Komponenten (neu, alle in `src/components/onboarding/`)

- `OnboardingLayout.tsx` — Ambient-Blur-Background + zentrierte GlassCard + Motion.
- `StepIndicator.tsx` — animierte Punkte/Balken.
- `PhaseList.tsx` — Statuskarten (idle/running/success/error) mit spring-Animation, Checkmark-Draw, Pulse.
- `ServerForm.tsx` — Multi-Step (Basics, Verbindung, Auth, Optionen) mit Live-Validierung.
- `ServerCard.tsx` — Premium-Karte (in Onboarding + Settings wiederverwendet).
- `ErrorDialog.tsx` — hochwertiger Dialog (Radix Dialog vorhanden via shadcn) mit Titel/Beschreibung/Details/Lösungsvorschlag/Retry-Button.
- `ImportDialog.tsx` — File-Upload + JSON-Paste, Vorschau, Konfliktauflösung.

Alle Komponenten nutzen bestehende `GlassCard`, `GlassButton`, `themes/motion`, `themes/glass`. Framer-Motion ist bereits Dependency (aus `_app.tsx`) — keine neuen Packages.

## i18n

`src/services/i18n/locales/de.ts` und `en.ts`: Neue Keys unter `onboarding.*` (welcome, intro, server, configure, test, discovery, done, errors, phases).

## Fehlerbehandlung

- `OnboardingController` mapped Fehler auf `AppError` (bestehend) mit Codes: `NETWORK_UNREACHABLE`, `TLS_FAILED`, `AUTH_FAILED`, `TIMEOUT`, `PROTOCOL_ERROR`, `DISCOVERY_FAILED`.
- `ErrorDialog` bekommt lokalisierte Lösungsvorschläge pro Code.
- Keine `alert()`/`confirm()`.

## Accessibility & PWA

- Alle Buttons ≥44×44, `aria-label`, klare Fokus-Ringe (via bestehende Tailwind-Utility).
- `AnimatePresence` respektiert `prefers-reduced-motion` via `useReducedMotion`.
- Onboarding-Routen sind in `manifest.webmanifest`-Scope; `start_url` bleibt `/`.

## Performance

- Alle Onboarding-Routen automatisch code-split (TanStack Auto Splitting).
- Framer-Variants aus `themes/motion` wiederverwenden.
- Selektoren mit `useSettingsStore((s) => s.field)` einzeln, keine Objekt-Selektoren.

## Nicht enthalten

- Keine Geräte-, Raum-, Szenen-UI.
- Kein Dashboard-Inhalt.
- Keine echte Discovery-UI mit Gerätelisten — nur Phasenanzeige.

## Verifikation

- `bunx tsgo --noEmit` grün.
- Manuell: frischer Storage → Route `/` leitet zu `/onboarding/welcome`; nach Anlegen + erfolgreichem Fake-Server-Test (Fehlerfall) zeigt `ErrorDialog`; bei bestehendem Server wird Onboarding übersprungen.
