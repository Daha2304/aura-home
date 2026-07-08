# Teil 7B – Device Experience

Ziel: Die `/devices/$deviceId`-Ansicht wird zur vollwertigen Premium-Smart-Home-Experience. Alle Bereiche entstehen **registry-basiert** aus Capabilities & Device-Properties – kein Typ-Switch, keine gerätespezifische Sonderlogik. Aufbauend auf Teil 7A (Capability Registry, Control Registry, Universal Control Engine, Command Queue).

## Architektur: Device Panel Registry

Neue **Panel Registry** analog zur Control Registry. Jedes Panel registriert sich selbst und deklariert, wann es sichtbar ist.

```text
Device
  → DevicePanelRegistry (Panel-Beschreibungen: id, title, group, priority, icon, isVisible(device), Component)
  → DevicePanelRenderer (iteriert Registry, filtert sichtbare Panels, staffelt Animationen)
```

**Neue Dateien**
- `src/models/devicePanel.ts` – `DevicePanelDescriptor { id, title, icon?, group, priority, isVisible(device), component }`; `DevicePanelGroup = "hero" | "status" | "controls" | "information" | "network" | "sensors" | "diagnostics" | "firmware" | "developer" | "custom"`.
- `src/services/devicePanels/DevicePanelRegistry.ts` – Plugin-Registry (O(1) Map), `register/get/all/visibleFor(device)`.
- `src/services/devicePanels/builtin/` – ein Modul pro eingebautem Panel (nur Deklaration + Component-Ref):
  - `heroPanel.tsx` – große Hero-Card, Icon, Name, Raum, Online, Favorit, Tags, Discovery, Firmware, Signal, Batterie.
  - `statusPanel.tsx` – Live-Statuszeile (online/offline/discovery/sync/warn/error, letzte Änderung, aktuelle Commands via CommandQueue-Store).
  - `controlsPanel.tsx` – dünner Wrapper um `UniversalControlRenderer` (Teil 7A).
  - `informationPanel.tsx` – Property Renderer (siehe unten).
  - `networkPanel.tsx` – IP/MAC/UUID/Serial/Protocol (nur wenn vorhanden).
  - `sensorsPanel.tsx` – readonly Capabilities via Universal Renderer, gefiltert auf readonly.
  - `diagnosticsPanel.tsx` – Lifecycle, letzte Verbindung, Command-Historie (aus `commandsStore`).
  - `firmwarePanel.tsx` – nur sichtbar wenn `firmware`/`hardwareVersion`/`softwareVersion` gesetzt.
  - `developerPanel.tsx` – Debug-JSON, sichtbar nur bei `settingsStore.debugWebSocket` o. ä. Dev-Flag.
- `src/services/devicePanels/index.ts` – `bootstrapDevicePanels()`.

**Bearbeitet:** `src/services/bootstrap.ts` – Aufruf `bootstrapDevicePanels()` nach `registerBuiltinControls()`.

## Property Renderer (registry-basiert)

Damit die Info-/Netzwerk-/Firmware-Panels keinerlei Hardcodierung enthalten:

- `src/models/deviceProperty.ts` – `DevicePropertyDescriptor { id, label, group, priority, read(device) → string|number|boolean|undefined, format?, icon?, sensitive?, tone? }`; `DevicePropertyGroup = "identity" | "network" | "firmware" | "hardware" | "diagnostics" | "custom"`.
- `src/services/deviceProperties/DevicePropertyRegistry.ts` – Plugin-Registry.
- `src/services/deviceProperties/builtin.ts` – Built-ins für alle bereits in `Device` vorhandenen Felder (`name/type/manufacturer/model/firmware/hardwareVersion/softwareVersion/uuid/mac/serial/lifecycle/version/serverVersion/floor/description`) + dynamische Ausgabe von `device.customProperties`.
- `src/components/devices/properties/PropertyList.tsx` – rendert eine Gruppe: DS-`GlassListItem`-artige Zeilen, mit Icon, Label, Wert. Filtert leere Werte, hides sensitive.

Panels konsumieren `devicePropertyRegistry.byGroup("identity" | "network" | …)`.

## Command-Historien-Panel (Diagnose)

`diagnosticsPanel.tsx` liest `useCommandsStore().history` gefiltert per `byDevice(device.id)` und rendert die letzten N Commands mit DS-`StatusBadge` (Zustand aus 7A: queued/sending/…/completed/failed). Framer-Motion `AnimatePresence` beim Eintreffen neuer Einträge.

## Hero + Status (registry-Panels ersetzen Inline-JSX)

Der aktuelle Inline-Hero in `_app.devices.$deviceId.tsx` zieht in `heroPanel.tsx` um – unverändertes visuelles Ergebnis (`HeroCard`, `layoutIds.deviceCard`, Favorit-IconButton, Signal/Battery/Discovery/Version MetricCards). Der neue Status-Panel-Bereich zeigt zusätzlich aktive Commands als animierte Chips (Queued/Sending/Retrying/Failed).

## Universal Controls – neue Capability-Descriptoren

Für die in 7A noch fehlenden Capabilities registriert werden in `src/services/capabilities/builtin.ts` (nur Zusätze, bestehende Descriptors bleiben):

- `colorTemperature` (kind bereits vorbereitbar; neue optional Capability, `slider.color-temperature`).
- `fanSpeed` (dimmer-ähnlich, `slider.percentage`).
- `tilt` (`slider.tilt`).
- `volume`, `mute` (Media-Kontext, `slider.volume`, `toggle.mute`).
- `seek` (`slider.percentage`, unit `s`).
- `powerConsumption`, `voltage`, `current` (readonly, `readout.number` mit Units W/V/A).
- Generische `boolean`, `number`, `text`, `enum` (Fallbacks für dynamische `DeviceFunction`-Werte).

Wichtig: Der bestehende `Capability`-Union in `src/models/capability.ts` bleibt unangetastet. Neue Capabilities werden über `"custom"`-Kind + `capability.id` diskriminiert und über den bereits vorhandenen `CapabilityDescriptor.kind` (`string & {}` Anteil) registriert. Die Universal Control Engine liest ausschließlich `cap.kind` → RegistryLookup, daher keine Union-Erweiterung nötig.

Zusätzlich: Der Control-Factory-Loop wird erweitert, um auch `device.functions[]` (protokoll-agnostische generische Funktionen) durchzureichen, indem für jede `DeviceFunction` ein synthetischer Capability-artiger Eintrag erzeugt wird (`kind = function.kind`, `id = function.id`, `value = function.value`, `readonly = function.readonly`). Das aktiviert automatisch `boolean/number/text/enum/custom`-Controls für alle generischen Funktionen ohne UI-Änderung.

Neue Control-Komponenten sind nicht nötig – die Slider/Stepper/Readout-Bausteine aus 7A decken alle neuen Descriptoren ab. Nur zwei kleine Ergänzungen in `src/components/devices/controls/builtin.tsx`:
- `toggle.mute` (Alias auf `PowerToggle`, Icon `VolumeX`).
- `readout.text` bleibt Fallback.

## Shared-Element-Transitions

- `HeroCard` nutzt bereits `layoutIds.deviceCard(device.id)` – bleibt.
- Panels erscheinen gestaffelt: `motion.section` mit `initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} transition={{delay: i * 0.04}}`.
- Controls-Panel: `AnimatePresence` bereits in `UniversalControlRenderer`/`ControlFeedback`.
- Werte animieren via `motion.span` mit `layout` in Readouts (bereits in 7A ProgressReadout).

## Gesten (vorbereitet, nicht aktiviert)

Neuer Hook `src/hooks/useDeviceGestures.ts` – exportiert bewusst leere/no-op Handler mit klaren TODO-Kommentaren:
- `onSwipeBack` → hookt später in Router zurück.
- `onPullToRefresh` → ruft später `discoveryEngine.refresh(device.id)`.
- `onLongPress` → öffnet später `DeviceQuickActions` (existiert bereits).

Damit ist die API vorhanden, aber keine Verhaltensänderung. Kein neuer Library-Import.

## Dashboard- & Room-Integration

Kein Codepfad-Umbau nötig: Widgets und Room-Views lesen bereits aus `devicesStore`/`roomMetricsStore`, die durch die Command-Queue (Optimistic Updates aus 7A) live aktualisiert werden. Änderung nur:
- `src/services/widgets/builtin/devices.tsx` – prüfen, dass Widget-Renderer `React.memo` und selektive Selektoren nutzen (Fixups wenn nötig, keine neuen Widgets).
- `src/routes/_app.rooms.$roomId.tsx` – bleibt (Teil 6B).

## Neue/geänderte Dateien

**Neu**
- `src/models/devicePanel.ts`
- `src/models/deviceProperty.ts`
- `src/services/devicePanels/DevicePanelRegistry.ts`
- `src/services/devicePanels/index.ts`
- `src/services/devicePanels/builtin/heroPanel.tsx`
- `src/services/devicePanels/builtin/statusPanel.tsx`
- `src/services/devicePanels/builtin/controlsPanel.tsx`
- `src/services/devicePanels/builtin/informationPanel.tsx`
- `src/services/devicePanels/builtin/networkPanel.tsx`
- `src/services/devicePanels/builtin/sensorsPanel.tsx`
- `src/services/devicePanels/builtin/diagnosticsPanel.tsx`
- `src/services/devicePanels/builtin/firmwarePanel.tsx`
- `src/services/devicePanels/builtin/developerPanel.tsx`
- `src/services/deviceProperties/DevicePropertyRegistry.ts`
- `src/services/deviceProperties/builtin.ts`
- `src/services/deviceProperties/index.ts`
- `src/components/devices/properties/PropertyList.tsx`
- `src/components/devices/detail/DevicePanelRenderer.tsx` – iteriert Registry, staffelt Framer-Motion.
- `src/hooks/useDeviceGestures.ts`

**Bearbeitet**
- `src/services/capabilities/builtin.ts` – zusätzliche Descriptors (colorTemperature, fanSpeed, tilt, volume, mute, seek, powerConsumption, voltage, current, generic boolean/number/text/enum).
- `src/services/controls/ControlFactory.ts` – zusätzlich `device.functions[]` als synthetische Capabilities.
- `src/components/devices/controls/builtin.tsx` – `toggle.mute` Registrierung.
- `src/services/bootstrap.ts` – `bootstrapDevicePanels()` und `bootstrapDevicePropertyRegistry()`.
- `src/routes/_app.devices.$deviceId.tsx` – ersetzt Inline-Sections durch `<DevicePanelRenderer device={device} />` (Route-String, `notFoundComponent`, `layoutIds` bleiben unverändert). Alte JSX-Blocks werden gelöscht.
- `src/models/index.ts` – neue Exporte.

## Performance
- Panels: `React.memo`, `isVisible(device)` einmalig pro Render.
- Property-Zeilen: memoized nach `device.id + property.id + value`.
- Controls: bereits in 7A optimiert.
- Renderer subscribed nur zur ID: `useDevicesStore((s) => s.byId(deviceId))` → identity-basiert.

## Accessibility
- Panels als `<section aria-labelledby>`.
- Große Touchflächen bleiben durch DS-Komponenten (>=44px).
- Fokusreihenfolge: Hero → Status → Controls → Info → Network → Diagnostics.
- Screenreader-Landmarks via `role="region"` + Panel-Title.

## Was NICHT gebaut wird
Keine Szenen, keine Automationen, keine Historie-Diagramme, keine Kamera-Streams, keine gerätespezifischen Komponenten.

## Verifikation
- `bunx tsgo --noEmit`
- Playwright auf `/devices/$id`: Hero rendert, Panels erscheinen gestaffelt, Universal Controls funktionieren mit Command-Feedback, Netzwerk/Firmware-Panels verstecken sich bei fehlenden Werten, Diagnose zeigt Command-Historie.
