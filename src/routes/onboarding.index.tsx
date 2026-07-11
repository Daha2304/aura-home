import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useHydrated } from "@/hooks/useHydrated";
import { useOnboardingStore } from "@/store/slices/onboardingStore";
import { useSettingsStore } from "@/store/slices/settingsStore";

export const Route = createFileRoute("/onboarding/")({
  component: OnboardingIndex,
});

function OnboardingIndex() {
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const completed = useOnboardingStore((s) => s.completed);
  const hasServers = useSettingsStore((s) => s.servers.length > 0);

  useEffect(() => {
    if (!hydrated) return;

    if (completed || hasServers) {
      navigate({ to: "/", replace: true });
      return;
    }

    navigate({ to: "/onboarding/welcome", replace: true });
  }, [completed, hasServers, hydrated, navigate]);

  return (
    <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
      Lade …
    </div>
  );
}
