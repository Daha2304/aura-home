import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { pageTransition } from "@/themes/motion";
import { useCommunicationLayer } from "@/hooks/useCommunicationLayer";
import { useHydrated } from "@/hooks/useHydrated";
import { useOnboardingStore } from "@/store/slices/onboardingStore";
import { useSettingsStore } from "@/store/slices/settingsStore";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingRoot,
});

function OnboardingRoot() {
  useCommunicationLayer();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reduce = useReducedMotion();
  const hydrated = useHydrated();
  const completed = useOnboardingStore((s) => s.completed);
  const flow = useOnboardingStore((s) => s.flow);
  const draft = useOnboardingStore((s) => s.draftServer);
  const hasServers = useSettingsStore((s) => s.servers.length > 0);

  useEffect(() => {
    document.body.classList.add("onboarding-active");
    return () => document.body.classList.remove("onboarding-active");
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if ((completed || hasServers) && !flow && !draft) {
      navigate({ to: "/", replace: true });
    }
  }, [completed, draft, flow, hasServers, hydrated, navigate]);

  return (
    <AnimatePresence initial={false}>
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
