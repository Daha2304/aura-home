import { createFileRoute, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useCommunicationLayer } from "@/hooks/useCommunicationLayer";
import { useSettingsStore } from "@/store/slices/settingsStore";
import { ToastHost } from "@/components/notifications/ToastHost";
import { CommandPaletteHost } from "@/components/search/CommandPaletteHost";
import { useHydrated } from "@/hooks/useHydrated";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  useCommunicationLayer();
  const routeKey = useRouterState({ select: (s) => s.location.href });
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const hasServers = useSettingsStore((s) => s.servers.length > 0);
  const ensureDefaultServer = useSettingsStore((s) => s.ensureDefaultServer);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const resetScroll = () => {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
    };

    resetScroll();
    const frame = window.requestAnimationFrame(resetScroll);
    const lateFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(resetScroll);
    });
    const timeout = window.setTimeout(resetScroll, 250);

    return () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(lateFrame);
      window.clearTimeout(timeout);
    };
  }, [routeKey]);

  // Only force onboarding when no server profile exists at all.
  // A failed connection MUST NEVER redirect back to onboarding — the
  // connection is an app status, never a navigation gate.
  useEffect(() => {
    if (!hydrated || hasServers) return;
    ensureDefaultServer();
    if (useSettingsStore.getState().servers.length === 0) {
      navigate({ to: "/onboarding/welcome", replace: true });
    }
  }, [ensureDefaultServer, hydrated, hasServers, navigate]);

  return (
    <AppShell>
      <Outlet />
      <ToastHost />
      <CommandPaletteHost />
    </AppShell>
  );
}
