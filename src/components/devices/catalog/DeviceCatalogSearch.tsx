import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

/**
 * Debounced Search-Input. Rein Präsentation — die Filterlogik liegt
 * ausschließlich im Intelligence Layer.
 */
export function DeviceCatalogSearch({ value, onChange, placeholder, debounceMs = 150 }: Props) {
  const [local, setLocal] = useState(value);
  useEffect(() => {
    setLocal(value);
  }, [value]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (local !== value) onChange(local);
    }, debounceMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);
  return (
    <div className="glass-panel hairline flex items-center gap-2 px-3 py-2">
      <Search className="h-4 w-4 text-muted-foreground" />
      <input
        type="search"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder ?? "Geräte suchen …"}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        aria-label="Gerätesuche"
      />
      {local && (
        <button
          type="button"
          onClick={() => {
            setLocal("");
            onChange("");
          }}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Suche zurücksetzen"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
