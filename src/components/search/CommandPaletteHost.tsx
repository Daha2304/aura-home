import { useEffect } from "react";
import { CommandPalette } from "./CommandPalette";
import { useSearchStore } from "@/store/slices/searchStore";

/**
 * Global host: mounts CommandPalette and installs the Cmd/Ctrl+K global
 * shortcut. Also handles Escape when the palette is open (cmdk handles
 * navigation keys internally).
 */
export function CommandPaletteHost() {
  const toggle = useSearchStore((s) => s.togglePalette);
  const close = useSearchStore((s) => s.closePalette);
  const open = useSearchStore((s) => s.paletteOpen);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      const isK = e.key === "k" || e.key === "K";
      if (isK && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
        return;
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, close, open]);

  return <CommandPalette />;
}
