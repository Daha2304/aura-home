import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { GlassButton } from "@/components/glass/GlassButton";
import { ServerCard } from "@/components/onboarding/ServerCard";
import { useSettingsStore } from "@/store/slices/settingsStore";
import { useOnboardingStore } from "@/store/slices/onboardingStore";
import { createServerConfig } from "@/models/server";

export const Route = createFileRoute("/onboarding/server")({
  component: ServerChoiceScreen,
});

function ServerChoiceScreen() {
  const navigate = useNavigate();
  const servers = useSettingsStore((s) => s.servers);
  const setDraft = useOnboardingStore((s) => s.setDraft);

  const startNew = () => {
    setDraft(createServerConfig({}));
    navigate({ to: "/onboarding/configure" });
  };

  return (
    <OnboardingLayout step={2} totalSteps={5}>
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Server wählen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wähle einen bestehenden Server oder lege einen neuen an.
        </p>
      </div>
      <div className="flex-1 space-y-2">
        {servers.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <ServerCard
              server={s}
              onClick={() => {
                setDraft(s);
                navigate({ to: "/onboarding/configure" });
              }}
            />
          </motion.div>
        ))}
      </div>
      <div className="mt-5 flex flex-col gap-2">
        <GlassButton
          variant="primary"
          size="lg"
          className="w-full"
          onClick={startNew}
        >
          <Plus className="h-4 w-4" /> Neuen Server anlegen
        </GlassButton>
      </div>
    </OnboardingLayout>
  );
}
