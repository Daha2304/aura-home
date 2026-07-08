import { motion } from "framer-motion";
import { ALL_BREAKPOINTS } from "@/models/layout";
import type { LayoutBreakpoint } from "@/models/layout";
import { useEditorStore } from "@/store/slices/editorStore";
import { Smartphone, Tablet, Monitor } from "lucide-react";

const LABELS: Record<LayoutBreakpoint, { label: string; icon: React.ComponentType<{ className?: string }>; rotate?: boolean }> = {
  "phone-portrait": { label: "Phone", icon: Smartphone },
  "phone-landscape": { label: "Phone L", icon: Smartphone, rotate: true },
  "tablet-portrait": { label: "Tablet", icon: Tablet },
  "tablet-landscape": { label: "Tablet L", icon: Tablet, rotate: true },
  desktop: { label: "Desktop", icon: Monitor },
};

export function BreakpointSwitcher() {
  const bp = useEditorStore((s) => s.activeBreakpoint);
  const set = useEditorStore((s) => s.setBreakpoint);
  return (
    <div className="glass-panel hairline flex items-center gap-1 !rounded-full !p-1">
      {ALL_BREAKPOINTS.map((b) => {
        const { icon: Icon, rotate } = LABELS[b];
        const active = b === bp;
        return (
          <motion.button
            key={b}
            whileTap={{ scale: 0.94 }}
            onClick={() => set(b)}
            aria-label={LABELS[b].label}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors ${
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-[hsl(var(--foreground)/0.06)]"
            }`}
          >
            <Icon className={`h-4 w-4 ${rotate ? "rotate-90" : ""}`} />
          </motion.button>
        );
      })}
    </div>
  );
}
