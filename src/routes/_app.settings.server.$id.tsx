import { createFileRoute, useNavigate, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassButton } from "@/components/glass/GlassButton";
import { ServerForm } from "@/components/onboarding/ServerForm";
import { useSettingsStore } from "@/store/slices/settingsStore";
import {
  createServerConfig,
  validateServerConfig,
  type ServerDraft,
} from "@/models/server";

export const Route = createFileRoute("/_app/settings/server/$id")({
  component: EditServer,
  notFoundComponent: () => (
    <div className="p-6 text-center text-sm text-muted-foreground">
      Server nicht gefunden.
    </div>
  ),
});

function EditServer() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const server = useSettingsStore((s) => s.servers.find((x) => x.id === id));
  const updateServer = useSettingsStore((s) => s.updateServer);
  const removeServer = useSettingsStore((s) => s.removeServer);

  const [draft, setDraft] = useState<ServerDraft>(() => server ?? {});
  const [attempted, setAttempted] = useState(false);
  const validation = useMemo(() => validateServerConfig(draft), [draft]);

  if (!server) {
    throw notFound();
  }

  const save = () => {
    setAttempted(true);
    if (!validation.ok) return;
    updateServer(createServerConfig({ ...draft, id: server.id, createdAt: server.createdAt }));
    navigate({ to: "/settings/server" });
  };

  const remove = () => {
    removeServer(server.id);
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
      <PageHeader
        title={server.name}
        subtitle="Konfiguration bearbeiten"
        trailing={
          <GlassButton
            variant="ghost"
            size="sm"
            aria-label="Löschen"
            onClick={remove}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </GlassButton>
        }
      />
      <ServerForm
        draft={draft}
        onChange={(patch) =>
          setDraft({
            ...draft,
            ...patch,
            auth: { ...(draft.auth ?? {}), ...(patch.auth ?? {}) },
          })
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
