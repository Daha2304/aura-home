import type { LayoutBreakpoint } from "@/models/layout";

/**
 * Ermittelt den passenden LayoutBreakpoint aus Viewport-Breite/Höhe.
 * Reine Utility, DOM-frei — kann in Hooks und Services genutzt werden.
 */
export function detectBreakpoint(width: number, height: number): LayoutBreakpoint {
  const landscape = width > height;
  if (width >= 1280) return "desktop";
  if (width >= 900) return landscape ? "tablet-landscape" : "tablet-portrait";
  if (width >= 640) return landscape ? "phone-landscape" : "tablet-portrait";
  return landscape ? "phone-landscape" : "phone-portrait";
}

type Listener = (bp: LayoutBreakpoint) => void;

class BreakpointDetectorImpl {
  private current: LayoutBreakpoint = "desktop";
  private listeners = new Set<Listener>();
  private started = false;

  start(): void {
    if (this.started || typeof window === "undefined") return;
    this.started = true;
    const update = () => {
      const bp = detectBreakpoint(window.innerWidth, window.innerHeight);
      if (bp !== this.current) {
        this.current = bp;
        for (const l of this.listeners) l(bp);
      }
    };
    this.current = detectBreakpoint(window.innerWidth, window.innerHeight);
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("orientationchange", update, { passive: true });
  }

  get(): LayoutBreakpoint {
    return this.current;
  }

  subscribe(l: Listener): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }
}

export const breakpointDetector = new BreakpointDetectorImpl();
