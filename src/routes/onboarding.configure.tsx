import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { GlassButton } from "@/components/glass/GlassButton";
import { ServerForm } from "@/components/onboarding/ServerForm";
import { useOnboardingStore } from "@/store/slices/onboardingStore";
import { useSettingsStore } from "@/store/slices/settingsStore";
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
  const complete = useOnboardingStore((s) => s.complete);
  const existing = useSettingsStore((s) => s.servers);
  const addServer = useSettingsStore((s) => s.addServer);
  const updateServer = useSettingsStore((s) => s.updateServer);
  const setActive = useSettingsStore((s) => s.setActiveServer);
  const [attempted, setAttempted] = useState(false);

  const validation = useMemo(
    () => validateServerConfig(draft ?? {}),
    [draft],
  );

  useEffect(() => {
    if (!draft) setDraft(createServerConfig({}));
  }, [draft, setDraft]);

  if (!draft) return null;

  /**
   * Persistiert das Serverprofil lokal — unabhängig davon, ob eine
   * Verbindung möglich ist. Ein fehlgeschlagenes Netzwerk darf niemals
   * dazu führen, dass ein bereits eingegebenes Profil verloren geht.
   */
  const persistDraft = () => {
    const server = createServerConfig(draft);
    const isNew = !existing.some((s) => s.id === server.id);
    if (isNew) addServer(server);
    else updateServer(server);
    setActive(server.id);
    return server;
  };

  const onSaveAndOpen = () => {
    setAttempted(true);
    if (!validation.ok) return;
    persistDraft();
    complete();
    navigate({ to: "/", replace: true });
  };

  const onTestConnection = () => {
    setAttempted(true);
    if (!validation.ok) return;
    persistDraft();
    navigate({ to: "/onboarding/connect" });
  };

  return (
    <OnboardingLayout step={3} totalSteps={4}>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Server einrichten</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alle Angaben werden ausschließlich auf diesem Gerät gespeichert.
          Die Verbindung wird später im Hintergrund aufgebaut.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto pb-4">
        <ServerForm
          draft={draft}
          onChange={patchDraft}
          showErrors={attempted}
        />
      </div>
      <div className="sticky bottom-0 mt-4 flex flex-col gap-2 pb-2 pt-2">
        <GlassButton
          variant="primary"
          size="lg"
          className="w-full"
          onClick={onSaveAndOpen}
        >
          Speichern & Dashboard öffnen
        </GlassButton>
        <div className="flex gap-2">
          <GlassButton
            variant="ghost"
            size="md"
            onClick={() => navigate({ to: "/onboarding/server" })}
          >
            Zurück
          </GlassButton>
          <GlassButton
            variant="ghost"
            size="md"
            className="flex-1"
            onClick={onTestConnection}
          >
            Verbindung testen
          </GlassButton>
        </div>
      </div>
    </OnboardingLayout>
  );
}
