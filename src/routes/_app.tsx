import { createFileRoute, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { pageTransition } from "@/themes/motion";
import { useCommunicationLayer } from "@/hooks/useCommunicationLayer";
import { useSettingsStore } from "@/store/slices/settingsStore";
import { useOnboardingStore } from "@/store/slices/onboardingStore";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  useCommunicationLayer();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const hasServers = useSettingsStore((s) => s.servers.length > 0);
  const completed = useOnboardingStore((s) => s.completed);

  useEffect(() => {
    if (!completed && !hasServers) {
      navigate({ to: "/onboarding/welcome", replace: true });
    }
  }, [completed, hasServers, navigate]);

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
