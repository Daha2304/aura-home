
# Teil 5B – Dashboard Editor (visuell)

Voll funktionsfähiger Editor auf Basis der in 5A gebauten Engine. Keine echten Smart-Home-Widgets — der Editor arbeitet mit Registry-Platzhaltern. Legacy `WidgetGrid` bleibt unverändert; die Dashboard-Route wird auf die neue Canvas umgezogen.

## 1. Services (`src/services/dashboards/editor/`)

- `EditorController.ts` – Singleton, orchestriert Edit-Session (aktives Dashboard, Breakpoint, Selection, Clipboard, Modus). Emitter `editorEvents`.
- `HistoryStack.ts` – Command-Pattern (`do/undo`), begrenzte Tiefe, coalescing für drag/resize.
- `Clipboard.ts` – copy/cut/paste/duplicate über `widgetManager`.
- `Guides.ts` – berechnet magnetische Hilfslinien und Snap-Offsets aus Grid + Nachbar-Placements.
- `AutoSave.ts` – debounced `dashboardManager.persist()`, mit Version-Bump im Dashboard-Meta.
- `PlaceholderWidgets.ts` – registriert bei Editor-Mount 6 generische Platzhalter-Descriptors (`placeholder.card`, `placeholder.tile`, `placeholder.wide`, `placeholder.tall`, `placeholder.hero`, `placeholder.mini`) in `widgetRegistry` — reine Layout-Blöcke, keine Smart-Home-Logik.

## 2. Store (`src/store/slices/editorStore.ts`)

`useEditorStore` (nicht persistiert):
- `mode: "normal" | "edit"`, `activeBreakpoint`, `zoom` (0.5–1.5), `showGrid`, `showGuides`, `showSpacing`, `snap`, `lockAspect`
- `selection: Set<WidgetInstanceId>`, `hoverId`, `dragging`, `resizing`
- `clipboard`, `history: { past, future }` (Referenzen; Daten in `HistoryStack`)
- Actions: `enterEdit`, `exitEdit`, `select`, `toggleSelection`, `clearSelection`, `setBreakpoint`, `setZoom`, `toggleGrid`/`Guides`/`Spacing`/`Snap`/`LockAspect`, `setDragging`, `setResizing`

## 3. Hooks (`src/hooks/`)

- `useDashboardEditor.ts` – öffentliche API für Routen (Selektoren + Actions gebündelt, memoisiert).
- `useDragWidget.ts` – Pointer Events, 60 FPS via `requestAnimationFrame`, Touch + Mouse + Pen. Meldet an `EditorController`, ruft `widgetManager.move` beim Drop.
- `useResizeWidget.ts` – 8 Griffe, `lockAspect`-Support, Min/Max aus Descriptor, Snap.
- `useLongPressEdit.ts` – Long-Press (500 ms) auf Widget aktiviert Edit-Mode + Selection.
- `useEditorKeyboard.ts` – Delete, Cmd/Ctrl+C/X/V/D/Z/Shift-Z, Pfeiltasten (1 Zelle), Esc.
- `useAutoSave.ts` – bindet Store-Änderungen an `AutoSave`.

## 4. Komponenten (`src/components/dashboard/editor/`)

- `DashboardCanvas.tsx` – Haupt-Container, rendert Grid + Widgets, verwaltet Zoom-Transform, Breakpoint-Viewport-Skalierung. Nutzt Framer-Motion `layout`-Animationen.
- `GridBackground.tsx` – SVG-Raster, sichtbar nur im Edit-Mode oder wenn `showGrid`.
- `GuidesOverlay.tsx` – renderbare Hilfslinien während drag/resize (aus `Guides`).
- `SpacingOverlay.tsx` – Abstands-Badges zu Nachbarn.
- `WidgetFrame.tsx` – wrappt jede Instanz, zeigt Selection-Border, Resize-Handles, Kontextmenü-Trigger; delegiert Rendering an `WidgetRenderer`.
- `WidgetRenderer.tsx` – löst Descriptor über `widgetRegistry` auf; wenn `render` fehlt → `PlaceholderTile` mit Icon/Titel/Grid-Info.
- `PlaceholderTile.tsx` – hübscher Glass-Block für Platzhalter-Descriptors.
- `ResizeHandles.tsx` – 8 Griffe (N/E/S/W + Ecken) mit großen Touch-Zielflächen.
- `SelectionBox.tsx` – Rahmen + Tool-Chips (duplicate, delete, more).
- `EditorTopBar.tsx` – Fertig / Undo / Redo / Zoom / Breakpoint-Switcher / Hilfen-Toggles / Import-Export.
- `BreakpointSwitcher.tsx` – Chips für die 5 Breakpoints, feedbackt aktiven Viewport.
- `ZoomControl.tsx` – Steps 50/75/100/125/150 %.
- `WidgetToolbox.tsx` – seitliches Sheet (rechts auf Desktop, Bottom Sheet auf Mobile) mit Kategorie-Tabs, Suche, Favoriten (Prep), Drag-Source für Canvas.
- `ToolboxItem.tsx` – draggable Descriptor-Kachel.
- `PropertyEditor.tsx` – Sheet für ausgewählte Instanz: Titel, Untertitel, Icon-Picker, Farb-Picker, Opacity/Blur/Shadow-Slider, Padding/Margin/Radius, Animation-Select, Layer, Visibility.
- `PropertyField.tsx`, `SliderField.tsx`, `ColorField.tsx`, `IconField.tsx`, `AnimationField.tsx` – Bausteine.
- `ContextMenu.tsx` – rechtsklick / long-press: duplicate, delete, cut, copy, bring-to-front/back.
- `EmptyDashboardHint.tsx` – Aufforderung im Edit-Mode.

## 5. Routen

- Bestehendes `_app.index.tsx` bleibt Landing, aber leitet auf aktives Dashboard weiter.
- Neu: `_app.dashboards.$dashboardId.tsx` – Live-Ansicht (Normal-Mode) mit Toggle in Edit-Mode.
- Neu: `_app.dashboards.tsx` – Listen-Route (Dashboards-Übersicht mit Create/Duplicate/Import/Export/Reorder).
- Neu: `_app.dashboards.index.tsx` – Redirect zu aktivem Dashboard.
- `BottomNav`/`layout` erhalten keinen neuen Eintrag (nur Verlinkung aus Home).

## 6. Import / Export

`Export` erzeugt Datei über `dashboardManager.export`. `Import` per `<input type="file">` → `dashboardManager.import`. Fehler über bestehenden `errorBus`/`ErrorDialog` (Onboarding-Komponente wiederverwendbar oder minimaler neuer Dialog).

## 7. Animationen

- Framer Motion `layout`, `AnimatePresence` für Widget-Enter/Exit
- `whileTap`/`whileHover` für Toolbox-Items
- Spring-Presets aus `themes/motion`
- Keine CSS-Keyframe-Tricks

## 8. Performance

- `WidgetFrame` mit `React.memo` + gezielten Zustand-Selektoren
- Placements aus `useLayoutsStore` via `useShallow`
- Drag/Resize läuft in `useRef`-basierter Delta-Berechnung ohne State-Setzen pro Frame; State wird erst am Drop-Ende committet
- `HistoryStack`-Einträge coalescen aufeinander folgende move/resize innerhalb 200 ms

## 9. Touch

- Long-Press (500 ms) → Edit-Mode + Selection + Haptic
- Touch-Handles ≥ 32 px, mit größerer unsichtbarer Hitbox
- Passive-listener-Regeln beachtet, `touchAction: "none"` nur während drag

## 10. i18n

Neue Keys `editor.*` (Buttons, Property-Labels, Breakpoint-Namen, Toolbox-Kategorien) in `en.ts` + `de.ts`.

## 11. Verifikation

- `bunx tsgo --noEmit`
- Manuell: Dashboard erstellen → Widgets aus Toolbox ziehen (Platzhalter) → verschieben, resizen, Property-Editor, Undo/Redo, Copy/Paste, Import/Export, Breakpoint-Wechsel.

## Nicht enthalten

- Keine echten Smart-Home-Widgets, Geräte, Räume, Szenen, Kameras
- Keine Server-Sync-Änderungen
- Bestehender `dashboardStore` (Legacy) und `WidgetGrid` bleiben unangetastet
