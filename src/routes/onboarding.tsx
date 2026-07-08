import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { pageTransition } from "@/themes/motion";
import { useCommunicationLayer } from "@/hooks/useCommunicationLayer";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingRoot,
});

function OnboardingRoot() {
  useCommunicationLayer();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reduce = useReducedMotion();

  useEffect(() => {
    document.body.classList.add("onboarding-active");
    return () => document.body.classList.remove("onboarding-active");
  }, []);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={reduce ? undefined : pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}
