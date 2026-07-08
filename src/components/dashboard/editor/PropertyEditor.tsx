import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEditorStore } from "@/store/slices/editorStore";
import { useWidgetInstancesStore } from "@/store/slices/widgetInstancesStore";
import { widgetManager } from "@/services/widgets/WidgetManager";
import type { WidgetInstance } from "@/models/widgetInstance";
import type { WidgetAnimation } from "@/models/widgetAnimation";
import { springSoft } from "@/themes/motion";

const SHADOWS: Array<WidgetInstance["styling"]["shadow"]> = ["none", "sm", "md", "lg", "xl"];
const ANIMATIONS: WidgetAnimation[] = ["none", "fade", "scale", "slide", "blur", "glass", "spring"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function NumberField({ value, onChange, min, max, step = 1 }: { value: number | undefined; onChange: (n: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <input
      type="number"
      value={value ?? ""}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
      className="glass-panel hairline w-full !rounded-xl !p-0 px-3 py-2 text-sm outline-none"
    />
  );
}

function Slider({ value, onChange, min, max, step }: { value: number; onChange: (n: number) => void; min: number; max: number; step: number }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-primary"
      />
      <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
        {value}
      </span>
    </div>
  );
}

export function PropertyEditor() {
  const open = useEditorStore((s) => s.propertiesOpen);
  const setOpen = useEditorStore((s) => s.setPropertiesOpen);
  const selection = useEditorStore((s) => s.selection);
  const firstId = Array.from(selection)[0];
  const widget = useWidgetInstancesStore((s) => (firstId ? s.instances.get(firstId) : undefined));

  const patch = (p: Partial<WidgetInstance>) => {
    if (!widget) return;
    widgetManager.update(widget.id, p);
  };

  return (
    <AnimatePresence>
      {open && widget && (
        <motion.aside
          initial={{ x: -320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -320, opacity: 0 }}
          transition={springSoft}
          className="fixed left-0 top-0 z-40 flex h-full w-[340px] max-w-[92vw] flex-col gap-3 border-r border-border/40 bg-background/85 p-4 backdrop-blur-2xl"
        >
          <header className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">Eigenschaften</div>
              <div className="truncate text-xs text-muted-foreground">{widget.widgetType}</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
              aria-label="Schließen"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            <Field label="Titel">
              <input
                value={widget.title ?? ""}
                onChange={(e) => patch({ title: e.target.value })}
                className="glass-panel hairline w-full !rounded-xl !p-0 px-3 py-2 text-sm outline-none"
              />
            </Field>
            <Field label="Untertitel">
              <input
                value={widget.subtitle ?? ""}
                onChange={(e) => patch({ subtitle: e.target.value })}
                className="glass-panel hairline w-full !rounded-xl !p-0 px-3 py-2 text-sm outline-none"
              />
            </Field>
            <Field label="Icon (Lucide-Name)">
              <input
                value={widget.icon ?? ""}
                onChange={(e) => patch({ icon: e.target.value })}
                className="glass-panel hairline w-full !rounded-xl !p-0 px-3 py-2 text-sm outline-none"
              />
            </Field>

            <Field label="Farbe">
              <input
                type="color"
                value={widget.styling.color ?? "#4f46e5"}
                onChange={(e) => patch({ styling: { ...widget.styling, color: e.target.value } })}
                className="h-10 w-full cursor-pointer rounded-xl border border-border/40 bg-transparent"
              />
            </Field>

            <Field label="Transparenz">
              <Slider
                value={Math.round((widget.styling.opacity ?? 1) * 100)}
                min={20}
                max={100}
                step={1}
                onChange={(v) => patch({ styling: { ...widget.styling, opacity: v / 100 } })}
              />
            </Field>

            <Field label="Blur (px)">
              <Slider
                value={widget.styling.blur ?? 0}
                min={0}
                max={40}
                step={1}
                onChange={(v) => patch({ styling: { ...widget.styling, blur: v } })}
              />
            </Field>

            <Field label="Shadow">
              <div className="flex gap-1.5">
                {SHADOWS.map((s) => (
                  <button
                    key={s}
                    onClick={() => patch({ styling: { ...widget.styling, shadow: s } })}
                    className={`flex-1 rounded-lg px-2 py-1.5 text-xs capitalize ${
                      widget.styling.shadow === s ? "bg-primary text-primary-foreground" : "bg-[hsl(var(--foreground)/0.06)]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Padding">
                <NumberField value={widget.styling.padding} min={0} max={64} onChange={(v) => patch({ styling: { ...widget.styling, padding: v } })} />
              </Field>
              <Field label="Margin">
                <NumberField value={widget.styling.margin} min={0} max={64} onChange={(v) => patch({ styling: { ...widget.styling, margin: v } })} />
              </Field>
              <Field label="Radius">
                <NumberField value={widget.styling.borderRadius} min={0} max={40} onChange={(v) => patch({ styling: { ...widget.styling, borderRadius: v } })} />
              </Field>
              <Field label="Layer">
                <NumberField value={widget.layer} min={0} max={99} onChange={(v) => patch({ layer: v })} />
              </Field>
            </div>

            <Field label="Animation">
              <div className="grid grid-cols-4 gap-1.5">
                {ANIMATIONS.map((a) => (
                  <button
                    key={a}
                    onClick={() => patch({ animation: { ...widget.animation, kind: a } })}
                    className={`rounded-lg px-2 py-1.5 text-xs capitalize ${
                      widget.animation.kind === a ? "bg-primary text-primary-foreground" : "bg-[hsl(var(--foreground)/0.06)]"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Sichtbarkeit">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => patch({ visible: !widget.visible })}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm ${
                    widget.visible ? "bg-primary text-primary-foreground" : "bg-[hsl(var(--foreground)/0.06)]"
                  }`}
                >
                  {widget.visible ? "Sichtbar" : "Ausgeblendet"}
                </button>
              </div>
            </Field>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
