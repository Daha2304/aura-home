import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { LayoutDashboard, Home, Cpu, Sparkles, MoreHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

interface Tab {
  to: string;
  label: string;
  icon: LucideIcon;
  match?: (path: string) => boolean;
}

const tabs: Tab[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, match: (p) => p === "/" },
  { to: "/rooms", label: "Räume", icon: Home, match: (p) => p.startsWith("/rooms") },
  { to: "/devices", label: "Geräte", icon: Cpu, match: (p) => p.startsWith("/devices") },
  { to: "/scenes", label: "Szenen", icon: Sparkles, match: (p) => p.startsWith("/scenes") },
  {
    to: "/more",
    label: "Mehr",
    icon: MoreHorizontal,
    match: (p) =>
      p.startsWith("/more") ||
      p.startsWith("/automations") ||
      p.startsWith("/statistics") ||
      p.startsWith("/settings"),
  },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const haptic = useHapticFeedback();

  return (
    <nav
      className="z-30 flex h-[8.5rem] shrink-0 items-start justify-center px-4 pt-2 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
      aria-label="Hauptnavigation"
    >
      <div className="glass-nav flex w-full max-w-md items-center justify-around gap-1 p-1.5">
        {tabs.map((tab) => {
          const active = tab.match ? tab.match(pathname) : pathname === tab.to;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              onClick={() => haptic("light")}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-2 text-[11px] font-medium transition-colors",
                active ? "text-accent-foreground" : "text-foreground/70 hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-active-pill"
                  className="absolute inset-0 rounded-full bg-accent/90 shadow-md shadow-accent/25"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Icon
                className={cn(
                  "relative z-10 h-5 w-5",
                  active ? "text-accent-foreground" : "text-current",
                )}
                strokeWidth={active ? 2.4 : 2}
              />
              <span className="relative z-10">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
