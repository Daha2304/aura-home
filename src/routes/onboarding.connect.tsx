import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { GlassButton } from "@/components/glass/GlassButton";
import {
  PhaseList,
  type Phase,
  type PhaseState,
} from "@/components/onboarding/PhaseList";
import { ErrorDialog } from "@/components/onboarding/ErrorDialog";
import { useOnboardingStore } from "@/store/slices/onboardingStore";
import { useSettingsStore } from "@/store/slices/settingsStore";
import { createServerConfig } from "@/models/server";
import {
  onboardingController,
  type OnboardingPhase,
} from "@/services/onboarding/OnboardingController";
import type { AppErrorPayload } from "@/services/errors/AppError";

export const Route = createFileRoute("/onboarding/connect")({
  beforeLoad: () => {
    if (!useOnboardingStore.getState().draftServer) {
      throw redirect({ to: "/onboarding/server" });
    }
  },
  component: ConnectScreen,
});

const ORDER: OnboardingPhase[] = [
  "connecting",
  "authenticating",
  "discovering",
  "syncing",
  "done",
];

const LABELS: Record<OnboardingPhase, { label: string; description: string }> = {
  idle: { label: "Bereit", description: "" },
  connecting: {
    label: "Verbinde …",
    description: "Baue WebSocket-Verbindung auf",
  },
  authenticating: {
    label: "Authentifiziere …",
    description: "Zugangsdaten werden geprüft",
  },
  discovering: {
    label: "Discovery gestartet",
    description: "Server bereitet Geräte vor",
  },
  syncing: {
    label: "Synchronisiere …",
    description: "Übertrage aktuellen Zustand",
  },
  done: {
    label: "Fertig",
    description: "Alles bereit",
  },
  error: { label: "Fehler", description: "" },
};

function ConnectScreen() {
  const navigate = useNavigate();
  const draft = useOnboardingStore((s) => s.draftServer);
  const setError = useOnboardingStore((s) => s.setError);
  const lastError = useOnboardingStore((s) => s.lastError);
  const addServer = useSettingsStore((s) => s.addServer);
  const updateServer = useSettingsStore((s) => s.updateServer);
  const setActive = useSettingsStore((s) => s.setActiveServer);
  const markConnected = useSettingsStore((s) => s.markServerConnected);
  const existing = useSettingsStore((s) => s.servers);
  const complete = useOnboardingStore((s) => s.complete);

  const [phase, setPhase] = useState<OnboardingPhase>("idle");
  const [failed, setFailed] = useState<AppErrorPayload | null>(null);
  const [runId, setRunId] = useState(0);

  const server = useMemo(
    () => (draft ? createServerConfig(draft) : null),
    [draft],
  );

  useEffect(() => {
    if (!server) return;
    setFailed(null);
    setPhase("connecting");
    const offPhase = onboardingController.on("phase", (p) => {
      setPhase(p.phase);
      if (p.error) setFailed(p.error);
    });
    const offErr = onboardingController.on("error", (e) => {
      setFailed(e);
      setError(e);
    });
    const offDone = onboardingController.on("done", () => {
      // Persistieren
      const isNew = !existing.some((s) => s.id === server.id);
      if (isNew) addServer(server);
      else updateServer(server);
      setActive(server.id);
      markConnected(server.id);
      complete();
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      setTimeout(() => navigate({ to: "/onboarding/done" }), 400);
    });

    onboardingController.runConnectionTest(server).catch(() => {
      /* handled via error emitter */
    });

    return () => {
      offPhase();
      offErr();
      offDone();
      onboardingController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  const phases: Phase[] = ORDER.map((p) => ({
    id: p,
    label: LABELS[p].label,
    description: LABELS[p].description,
    state: stateFor(p, phase, failed),
  }));

  return (
    <OnboardingLayout step={4} totalSteps={5}>
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Verbindung wird geprüft</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {server ? `${server.name} · ${server.host}:${server.port}` : ""}
        </p>
      </div>
      <div className="flex-1">
        <PhaseList phases={phases} />
        {phase !== "done" && phase !== "error" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center text-xs text-muted-foreground"
          >
            Bitte einen Moment Geduld …
          </motion.div>
        )}
      </div>
      <div className="mt-6 flex gap-2">
        <GlassButton
          variant="ghost"
          size="md"
          onClick={() => {
            onboardingController.abort();
            navigate({ to: "/onboarding/configure" });
          }}
        >
          Bearbeiten
        </GlassButton>
      </div>

      <ErrorDialog
        open={!!failed}
        error={failed ?? lastError}
        onRetry={() => {
          setFailed(null);
          setRunId((n) => n + 1);
        }}
        onEdit={() => {
          setFailed(null);
          navigate({ to: "/onboarding/configure" });
        }}
        onCancel={() => setFailed(null)}
      />
    </OnboardingLayout>
  );
}

function stateFor(
  p: OnboardingPhase,
  current: OnboardingPhase,
  err: AppErrorPayload | null,
): PhaseState {
  const idx = ORDER.indexOf(p);
  const curIdx = ORDER.indexOf(current);
  if (err && curIdx === idx) return "error";
  if (curIdx > idx) return "success";
  if (curIdx === idx) return current === "done" ? "success" : "running";
  return "idle";
}
