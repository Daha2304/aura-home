import { useState, type FormEvent } from "react";
import type { Room, RoomType } from "@/models/room";
import type { HexColor } from "@/models/common";
import { ROOM_CATEGORIES } from "@/models/roomCategory";
import { GlassInput } from "@/components/ds/controls/GlassInput";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassSwitch } from "@/components/ds/controls/GlassSwitch";
import { RoomIcon } from "./RoomIcon";
import { cn } from "@/lib/utils";

const PRESET_COLORS: HexColor[] = [
  "#f59e0b",
  "#f97316",
  "#ec4899",
  "#8b5cf6",
  "#6366f1",
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#22c55e",
  "#84cc16",
  "#eab308",
  "#a855f7",
];

export interface RoomFormValue {
  name: string;
  type: RoomType;
  color: HexColor;
  floor?: number;
  description?: string;
  favorite: boolean;
  image?: string;
}

export interface RoomFormProps {
  initial?: Partial<Room>;
  submitLabel?: string;
  onSubmit: (value: RoomFormValue) => void;
  onCancel?: () => void;
}

export function RoomForm({ initial, submitLabel = "Speichern", onSubmit, onCancel }: RoomFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<RoomType>(initial?.type ?? "living");
  const [color, setColor] = useState<HexColor>((initial?.color as HexColor) ?? PRESET_COLORS[0]);
  const [floor, setFloor] = useState<string>(
    initial?.floor !== undefined ? String(initial.floor) : "",
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [favorite, setFavorite] = useState<boolean>(initial?.favorite ?? false);
  const [image, setImage] = useState(initial?.image ?? "");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      type,
      color,
      floor: floor.trim() === "" ? undefined : Number(floor),
      description: description.trim() || undefined,
      favorite,
      image: image.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <GlassInput
        label="Name"
        placeholder="Wohnzimmer"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        autoFocus
      />

      <div className="space-y-2">
        <span className="block text-[13px] font-medium">Raumtyp</span>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {ROOM_CATEGORIES.map((c) => (
            <button
              key={c.type}
              type="button"
              onClick={() => {
                setType(c.type);
                setColor(c.accent as HexColor);
              }}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl border p-3 text-xs transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                type === c.type
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-transparent bg-foreground/5 hover:bg-foreground/10",
              )}
              aria-pressed={type === c.type}
            >
              <RoomIcon type={c.type} className="h-5 w-5" />
              <span className="truncate">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="block text-[13px] font-medium">Farbe</span>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                "h-9 w-9 rounded-full border-2 transition-transform",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                color === c ? "border-foreground scale-110" : "border-transparent",
              )}
              style={{ background: c }}
              aria-label={`Farbe ${c}`}
              aria-pressed={color === c}
            />
          ))}
        </div>
      </div>

      <GlassInput
        label="Etage (optional)"
        placeholder="0"
        type="number"
        value={floor}
        onChange={(e) => setFloor(e.target.value)}
      />

      <GlassInput
        label="Bild-URL (optional)"
        placeholder="https://…"
        value={image}
        onChange={(e) => setImage(e.target.value)}
      />

      <GlassInput
        label="Beschreibung (optional)"
        placeholder="Notizen zum Raum"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="flex items-center justify-between rounded-2xl bg-foreground/5 px-4 py-3">
        <div>
          <div className="text-sm font-medium">Favorit</div>
          <div className="text-xs text-muted-foreground">Als Favoriten markieren</div>
        </div>
        <GlassSwitch checked={favorite} onChange={setFavorite} aria-label="Favorit" />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <GlassButton type="button" variant="ghost" onClick={onCancel}>
            Abbrechen
          </GlassButton>
        )}
        <GlassButton type="submit" variant="primary">
          {submitLabel}
        </GlassButton>
      </div>
    </form>
  );
}
