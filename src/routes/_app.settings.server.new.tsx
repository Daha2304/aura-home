import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassButton } from "@/components/glass/GlassButton";
import { ServerForm } from "@/components/onboarding/ServerForm";
import { useSettingsStore } from "@/store/slices/settingsStore";
import {
  createServerConfig,
  validateServerConfig,
  type ServerDraft,
} from "@/models/server";

export const Route = createFileRoute("/_app/settings/server/new")({
  component: NewServer,
});

function NewServer() {
  const navigate = useNavigate();
  const addServer = useSettingsStore((s) => s.addServer);
  const [draft, setDraft] = useState<ServerDraft>(() => createServerConfig({}));
  const [attempted, setAttempted] = useState(false);
  const validation = useMemo(() => validateServerConfig(draft), [draft]);

  useEffect(() => {
    document.getElementById("server-form-top")?.scrollIntoView();
  }, []);

  const save = () => {
    setAttempted(true);
    if (!validation.ok) return;
    const cfg = createServerConfig(draft);
    addServer(cfg);
    navigate({ to: "/settings/server" });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => navigate({ to: "/settings/server" })}
        className="mb-2 inline-flex items-center gap-1 text-sm text-accent"
      >
        <ChevronLeft className="h-4 w-4" /> Server
      </button>
      <div id="server-form-top" />
      <PageHeader title="Neuer Server" subtitle="Verbindung konfigurieren" />
      <ServerForm
        draft={draft}
        onChange={(patch) =>
          setDraft({ ...draft, ...patch, auth: { ...(draft.auth ?? {}), ...(patch.auth ?? {}) } })
        }
        showErrors={attempted}
      />
      <div className="mt-6 flex gap-2 pb-4">
        <GlassButton
          variant="ghost"
          size="md"
          onClick={() => navigate({ to: "/settings/server" })}
        >
          Abbrechen
        </GlassButton>
        <GlassButton
          variant="primary"
          size="lg"
          className="flex-1"
          onClick={save}
        >
          Speichern
        </GlassButton>
      </div>
    </>
  );
}
