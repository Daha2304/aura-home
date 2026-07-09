import { createFileRoute, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { pageTransition } from "@/themes/motion";
import { useCommunicationLayer } from "@/hooks/useCommunicationLayer";
import { useSettingsStore } from "@/store/slices/settingsStore";
import { ToastHost } from "@/components/notifications/ToastHost";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  useCommunicationLayer();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const hasServers = useSettingsStore((s) => s.servers.length > 0);

  // Only force onboarding when no server profile exists at all.
  // A failed connection MUST NEVER redirect back to onboarding — the
  // connection is an app status, never a navigation gate.
  useEffect(() => {
    if (!hasServers) {
      navigate({ to: "/onboarding/welcome", replace: true });
    }
  }, [hasServers, navigate]);

  return (
    <AppShell>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          variants={pageTransition}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}
