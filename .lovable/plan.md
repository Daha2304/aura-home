# Teil 7A – Universal Device Control Engine

Ziel: Alle Gerätesteuerungen entstehen ausschließlich aus **Capabilities**. Kein `if(type==="light")`, kein Switch nach `DeviceTypeId`. Neue Geräte werden automatisch bedienbar, sobald sie Capabilities melden.

Basis: `Capability`-Union (`src/models/capability.ts`), `Device.capabilities[]`, `commandQueue` (mit Optimistic + Rollback via `CommandTracker`), Design System (`GlassSwitch`, `GlassSlider`, `SegmentedControl`, `IconButton`, `StatusBadge`, `GlassInput`), Discovery-Events über `wsManager.dispatcher` + `useDevicesStore`.

## Architektur

```text
Device.capabilities[]
  → CapabilityRegistry     (Descriptor pro capability.kind, pluginbar)
  → ControlRegistry        (Control-Bindings pro capability.kind)
  → ControlFactory         (baut ControlSpecs aus Device+Capabilities)
  → UniversalControlRenderer (rendert ControlSpecs via Registry-Lookup)
  → DeviceDetail Section "Steuerung"
```

Alle Schreibpfade laufen über `commandQueue.enqueue(deviceId, key, value, { optimistic:true })`. Kein Store-Write, kein direktes `wsManager.send`.

## Neue Dateien

**Models**
- `src/models/capabilityDescriptor.ts` – `CapabilityDescriptor` (id, kind, name, description, category (`general|lighting|climate|media|sensor|energy|network|system|custom`), dataType (`boolean|number|string|enum|color|composite`), unit, icon, priority, readOnly, min/max/step/precision, defaultValue, format, validation, controlType, rendererId, events, custom).
- `src/models/controlSpec.ts` – `ControlSpec` (id, deviceId, capabilityId, capabilityKind, controlType, descriptor, currentValue, commandKey, group, priority, readOnly).
- `src/models/controlType.ts` – String-Union aller Control-IDs (siehe unten).
- Ergänzung `src/models/index.ts`.

**Capability Registry** – `src/services/capabilities/`
- `CapabilityRegistry.ts` – O(1) Map<kind, Descriptor>, `register/get/all/byCategory`. Versioniert, typisiert.
- `builtin/` – ein Modul pro Capability-Kind: `onOff.ts`, `dimmer.ts`, `rgb.ts`, `temperature.ts`, `humidity.ts`, `position.ts`, `mode.ts`, `mediaTransport.ts`, `stream.ts`, `energy.ts`, `custom.ts`. Jedes registriert seinen Descriptor.
- `index.ts` – `bootstrapCapabilityRegistry()`.

**Control Registry** – `src/services/controls/`
- `ControlRegistry.ts` – `register(controlType, { component, validate?, format? })`, `resolve(controlType)`. Mehrere Controls pro Capability erlaubt (Registry ist per Control-Type, nicht per Capability).
- `ControlFactory.ts` – `buildForDevice(device)` → `ControlSpec[]`: iteriert `device.capabilities`, fragt `CapabilityRegistry` nach Descriptor, erzeugt eine oder mehrere `ControlSpec`s, sortiert nach `group` + `priority`. Keine Gerätelogik.
- `validation.ts` – generische Validatoren (dataType, min, max, step, precision, enum, readOnly, unit).
- `commandKeys.ts` – deterministisches Mapping `capabilityKind → wire-key` (z.B. `onOff→"power"`, `dimmer→"brightness"`, `rgb→"rgb"`, `mode→"mode"`, `mediaTransport→"transport"`, `position→"position"`, `temperature→"targetTemperature"`). Zentral, keine Duplikate.
- `index.ts` – `bootstrapControlRegistry()`.

**Universal Controls** – `src/components/devices/controls/` (alle basieren auf DS)
- `PowerToggle.tsx`, `GlassSwitchControl.tsx` (onOff)
- `PercentageSlider.tsx` (dimmer, position, tilt), `NumericStepper.tsx`
- `TemperatureSlider.tsx` (temperature/target), `ColorTemperatureControl.tsx`
- `ColorPickerControl.tsx` (rgb – Hue+Saturation, kein zusätzliches Lib, HSL→RGB)
- `DropdownControl.tsx`, `SegmentedControlBinding.tsx` (mode)
- `MediaTransportControl.tsx` (Play/Pause/Stop Button-Group), `VolumeSlider.tsx`, `PositionSlider.tsx`, `MuteToggle.tsx`
- `LockControl.tsx`, `AlarmControl.tsx`
- `BooleanReadout.tsx`, `TextReadout.tsx`, `NumberReadout.tsx`, `EnumReadout.tsx`, `ProgressReadout.tsx`, `StatusReadout.tsx` (readonly)
- `CustomControl.tsx` (Fallback)
- `index.ts` registriert alle via `controlRegistry.register(...)`.

**Renderer & Groups**
- `src/components/devices/controls/UniversalControlRenderer.tsx` – `<UniversalControlRenderer device={} />` ruft `controlFactory.buildForDevice(device)`, gruppiert nach `descriptor.category`, rendert pro Spec über `controlRegistry.resolve(spec.controlType).component`. `React.memo` pro Spec, key = `spec.id`. Reagiert auf Store-Updates (live) und `commandsStore` (Feedback).
- `ControlGroupSection.tsx` – DS `SectionCard`, Gruppenlabel + Icon aus Descriptor-Kategorie.
- `ControlFeedback.tsx` – zeigt Command-State (queued/sending/sent/retrying/completed/failed/cancelled) als `StatusBadge`/Spinner. Liest aus `useCommandsStore` gefiltert nach `deviceId+key`. Framer Motion Transitions.

**Store**
- `src/store/slices/commandsStore.ts` existiert bereits (verwendet von `CommandQueue`). Neuer Selector `byDeviceKey(deviceId, key)` falls fehlend – sonst inline `useCommandsStore(s => ...)`.

**Bootstrap**
- `src/services/bootstrap.ts`: nach `bootstrapIntelligence()`, vor `bootstrapDeviceRegistry()`-nahen Widgets → `bootstrapCapabilityRegistry()` + `bootstrapControlRegistry()` aufrufen. Registrierung ist idempotent.

## Bearbeitete Dateien
- `src/routes/_app.devices.$deviceId.tsx` – neue Section **"Steuerung"** ganz oben nach Hero: `<UniversalControlRenderer device={device} />`. Alte "Capabilities"-Chip-Section bleibt (Info). Kein Typ-Switch.
- `src/models/index.ts` – Exporte.
- `src/services/bootstrap.ts` – Registry-Boot.

## Command-Fluss & Feedback

1. Control ruft `onChange(value)` →
2. `commandQueue.enqueue(device.id, commandKeys[capability.kind], value, { optimistic:true })` →
3. `CommandTracker` schreibt optimistischen Wert in `devicesStore` (Snapshot für Rollback).
4. Renderer liest neuen Wert live aus `devicesStore` → UI reagiert sofort.
5. `ControlFeedback` zeigt Zustand animiert (Framer Motion: `queued→sending→sent→completed`).
6. Bei `failed`/`cancelled` rollt `CommandTracker` zurück; Renderer zeigt Fehler-Badge.

Alle Änderungen laufen ausschließlich hierüber. Kein `wsManager.send`, kein direkter `upsertDevice`.

## Validierung

`validation.ts` prüft vor `enqueue`:
- dataType-Cast (`number`, `boolean`, enum-Zugehörigkeit)
- clamp(min,max), snap(step), round(precision)
- readOnly → keine Command-Erzeugung, nur Anzeige
- unit-Konvertierung, wenn Descriptor abweicht (z.B. `%` vs. `0..1`)

Ungültige Werte werden verworfen und via `errorBus` gemeldet.

## Live Updates

`UniversalControlRenderer` abonniert `useDevicesStore` per selector (`shallow`, memoized). Kein Polling, keine Refresh-Buttons. Discovery-`device.state`-Events fließen bereits über bestehende Pipeline in den Store.

## Performance
- `React.memo` auf allen Control-Komponenten (Vergleich per `spec.id + currentValue + commandState`).
- `ControlFactory` cached `ControlSpec[]`-Ergebnis per `device.id + capabilities-Hash` (WeakMap).
- Selectors mit `useShallow` in Renderer.
- Lazy: Registry-Lookups sind O(1) Maps.

## Accessibility
- Große Touchflächen (min 44px) – DS-Komponenten erfüllen das bereits.
- `aria-label` an jedem Control aus `descriptor.name`.
- Slider mit `role="slider"`, `aria-valuenow/min/max` (bereits in `GlassSlider`).
- Keyboard: `GlassSwitch`/`SegmentedControl` sind fokussierbar.

## Was NICHT dazugehört
Keine Szenen, keine Automationen, keine Historie, keine Diagramme, keine Kameras, keine gerätespezifischen Sonderkomponenten.

## Verifikation
- `bunx tsgo --noEmit`
- Playwright: `/devices/$id` einer On/Off-Lampe (Toggle), eines Dimmers (Slider), eines Thermostats (Temperature), eines Mode-Devices – Command wird ausgelöst, optimistischer Wert erscheint, Feedback-Badge durchläuft `sending→completed`.

## Plugin-Verträglichkeit

Neue Capability = nur zwei Registrierungen:
```ts
capabilityRegistry.register({ kind:"foo", ... });
controlRegistry.register("foo.slider", { component: FooSlider, validate, format });
```
Renderer und Detailseite bleiben unverändert.
