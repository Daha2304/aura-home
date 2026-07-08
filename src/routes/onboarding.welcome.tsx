import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Home, Sparkles, Upload } from "lucide-react";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { GlassButton } from "@/components/glass/GlassButton";
import { ImportDialog } from "@/components/onboarding/ImportDialog";
import { useOnboardingStore } from "@/store/slices/onboardingStore";
import { useSettingsStore } from "@/store/slices/settingsStore";

export const Route = createFileRoute("/onboarding/welcome")({
  component: WelcomeScreen,
});

function WelcomeScreen() {
  const navigate = useNavigate();
  const startFirstRun = useOnboardingStore((s) => s.startFirstRun);
  const replaceServers = useSettingsStore((s) => s.replaceServers);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <OnboardingLayout>
      <div className="flex flex-1 flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 20 }}
          className="mx-auto mb-8 grid h-24 w-24 place-items-center rounded-[28px] bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-2xl shadow-primary/30"
        >
          <Home className="h-11 w-11" strokeWidth={2.2} />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center text-4xl font-black tracking-tight"
        >
          Willkommen
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="mx-auto mt-3 max-w-xs text-center text-[15px] text-muted-foreground"
        >
          Dein Zuhause. Elegant, schnell und privat gesteuert – direkt von
          diesem Gerät.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="flex flex-col gap-2.5"
      >
        <GlassButton
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => {
            startFirstRun();
            navigate({ to: "/onboarding/intro" });
          }}
        >
          <Sparkles className="h-4 w-4" />
          Einrichtung starten
        </GlassButton>
        <GlassButton
          variant="ghost"
          size="md"
          className="w-full"
          onClick={() => setImportOpen(true)}
        >
          <Upload className="h-4 w-4" />
          Vorhandene Konfiguration importieren
        </GlassButton>
      </motion.div>

      <ImportDialog
        open={importOpen}
        onCancel={() => setImportOpen(false)}
        onImport={(servers, mode) => {
          replaceServers(servers, mode);
          setImportOpen(false);
          navigate({ to: "/onboarding/server" });
        }}
      />
    </OnboardingLayout>
  );
}
