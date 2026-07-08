import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { pageTransition } from "@/themes/motion";
import { useCommunicationLayer } from "@/hooks/useCommunicationLayer";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  useCommunicationLayer();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
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
