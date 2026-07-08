import { BottomSheet } from "@/components/ds/cards/BottomSheet";
import { GlassButton } from "@/components/glass/GlassButton";
import type { DeviceFilterCriteria } from "@/services/intelligence";
import type { DeviceCategory } from "@/models/deviceCategory";

interface Props {
  open: boolean;
  onClose: () => void;
  criteria: DeviceFilterCriteria;
  onChange: (c: DeviceFilterCriteria) => void;
  manufacturers: string[];
  tags: string[];
}

const categories: DeviceCategory[] = [
  "lighting",
  "covers",
  "openings",
  "sensors",
  "climate",
  "media",
  "security",
  "energy",
  "appliance",
  "other",
];

const tri = <K extends keyof DeviceFilterCriteria>(
  criteria: DeviceFilterCriteria,
  onChange: (c: DeviceFilterCriteria) => void,
  key: K,
  label: string,
) => {
  const val = criteria[key];
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">{label}</span>
      <select
        value={val === undefined ? "any" : val === true ? "yes" : "no"}
        onChange={(e) => {
          const v = e.target.value;
          const next = { ...criteria };
          if (v === "any") delete next[key];
          else (next[key] as unknown) = v === "yes";
          onChange(next);
        }}
        className="glass-panel hairline rounded-full bg-transparent px-3 py-1 text-sm"
      >
        <option value="any">Egal</option>
        <option value="yes">Ja</option>
        <option value="no">Nein</option>
      </select>
    </div>
  );
};

export function DeviceCatalogFilters({
  open,
  onClose,
  criteria,
  onChange,
  manufacturers,
  tags,
}: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Filter">
      <div className="divide-y divide-white/10">
        <div className="py-3">
          <label className="mb-1 block text-xs uppercase tracking-wide text-muted-foreground">
            Kategorie
          </label>
          <select
            value={criteria.category ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              const next = { ...criteria };
              if (!v) delete next.category;
              else next.category = v as DeviceCategory;
              onChange(next);
            }}
            className="glass-panel hairline w-full rounded-full bg-transparent px-3 py-2 text-sm"
          >
            <option value="">Alle</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        {tri(criteria, onChange, "online", "Online")}
        {tri(criteria, onChange, "favorite", "Favorit")}
        {tri(criteria, onChange, "hasWarning", "Warnung")}
        {tri(criteria, onChange, "hasError", "Fehler")}
        <div className="py-3">
          <label className="mb-1 block text-xs uppercase tracking-wide text-muted-foreground">
            Hersteller
          </label>
          <select
            value={(criteria as { manufacturer?: string }).manufacturer ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              const next = { ...criteria } as DeviceFilterCriteria & { manufacturer?: string };
              if (!v) delete next.manufacturer;
              else next.manufacturer = v;
              onChange(next);
            }}
            className="glass-panel hairline w-full rounded-full bg-transparent px-3 py-2 text-sm"
          >
            <option value="">Alle</option>
            {manufacturers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        {tags.length > 0 && (
          <div className="py-3">
            <label className="mb-1 block text-xs uppercase tracking-wide text-muted-foreground">
              Tag
            </label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => {
                const active = criteria.tag === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      onChange({ ...criteria, tag: active ? undefined : t })
                    }
                    className={
                      "rounded-full px-3 py-1 text-xs " +
                      (active
                        ? "bg-primary text-primary-foreground"
                        : "glass-panel hairline text-muted-foreground")
                    }
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        <GlassButton onClick={() => onChange({})} className="flex-1">
          Zurücksetzen
        </GlassButton>
        <GlassButton onClick={onClose} className="flex-1">
          Schließen
        </GlassButton>
      </div>
    </BottomSheet>
  );
}
