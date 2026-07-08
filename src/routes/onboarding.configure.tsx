import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { GlassButton } from "@/components/glass/GlassButton";
import { ServerForm } from "@/components/onboarding/ServerForm";
import { useOnboardingStore } from "@/store/slices/onboardingStore";
import { createServerConfig, validateServerConfig } from "@/models/server";

export const Route = createFileRoute("/onboarding/configure")({
  beforeLoad: () => {
    if (!useOnboardingStore.getState().draftServer) {
      throw redirect({ to: "/onboarding/server" });
    }
  },
  component: ConfigureScreen,
});

function ConfigureScreen() {
  const navigate = useNavigate();
  const draft = useOnboardingStore((s) => s.draftServer);
  const patchDraft = useOnboardingStore((s) => s.patchDraft);
  const setDraft = useOnboardingStore((s) => s.setDraft);
  const [attempted, setAttempted] = useState(false);

  const validation = useMemo(
    () => validateServerConfig(draft ?? {}),
    [draft],
  );

  useEffect(() => {
    if (!draft) setDraft(createServerConfig({}));
  }, [draft, setDraft]);

  if (!draft) return null;

  const onNext = () => {
    setAttempted(true);
    if (!validation.ok) return;
    setDraft({ ...draft });
    navigate({ to: "/onboarding/connect" });
  };

  return (
    <OnboardingLayout step={3} totalSteps={5}>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Server einrichten</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alle Angaben werden ausschließlich auf diesem Gerät gespeichert.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto pb-4">
        <ServerForm
          draft={draft}
          onChange={patchDraft}
          showErrors={attempted}
        />
      </div>
      <div className="sticky bottom-0 mt-4 flex gap-2 pb-2 pt-2">
        <GlassButton
          variant="ghost"
          size="md"
          onClick={() => navigate({ to: "/onboarding/server" })}
        >
          Zurück
        </GlassButton>
        <GlassButton
          variant="primary"
          size="lg"
          className="flex-1"
          onClick={onNext}
        >
          Verbindung testen
        </GlassButton>
      </div>
    </OnboardingLayout>
  );
}
