# Routing-Übersicht

TanStack Router file-based routing. Layout-Routen sind `_app.tsx` und
`onboarding.tsx`. Route-Tree wird automatisch generiert.

## App-Routen (`_app/*`)

- `/` — Dashboard-Home
- `/dashboards`, `/dashboards/:id`, `/dashboards/:id/edit`
- `/rooms`, `/rooms/:id`
- `/devices`, `/devices/:id`
- `/scenes`, `/scenes/:id`, `/scenes/:id/edit`
- `/groups`, `/groups/:id`
- `/automations`, `/automations/:id`, `/automations/:id/edit`, `/automations/new`
- `/analytics`, `/statistics`, `/history`, `/timeline`
- `/inbox`, `/inbox/:notificationId`
- `/search`, `/search/results`, `/search/history`, `/search/favorites`
- `/users`, `/users/:id`, `/users/:id/edit`
- `/profiles`, `/roles`, `/permissions`
- `/more`

## Einstellungen (`/settings/*`)

- Server, Sprache, Darstellung, Benachrichtigungen, Benutzer
- Offline, Backup, Restore, Update, Speicher, App
- **Diagnose** (`/settings/diagnostics`) — System-Gesundheit
- **Performance** (`/settings/performance`) — FPS, Flags
- **Logs** (`/settings/logs`) — Filter, Export
- **Entwickler** (`/settings/developer`) — Debug, Live-Log

## Onboarding

- `/onboarding/*` — welcome, intro, server, connect, configure, done
