import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { GlassButton } from "@/components/glass/GlassButton";
import { useSettingsStore } from "@/store/slices/settingsStore";

export const Route = createFileRoute("/onboarding/done")({
  component: DoneScreen,
});

function DoneScreen() {
  const navigate = useNavigate();
  const active = useSettingsStore((s) => s.activeServer());

  return (
    <OnboardingLayout step={5} totalSteps={5}>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="mb-6 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-success to-primary text-primary-foreground shadow-2xl shadow-success/30"
        >
          <Check className="h-12 w-12" strokeWidth={3} />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-3xl font-black"
        >
          Alles bereit
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="mt-2 max-w-xs text-[15px] text-muted-foreground"
        >
          {active ? `Verbunden mit ${active.name}.` : "Einrichtung abgeschlossen."}{" "}
          Dein Zuhause wartet.
        </motion.p>
      </div>
      <GlassButton
        variant="primary"
        size="lg"
        className="w-full"
        onClick={() => navigate({ to: "/", replace: true })}
      >
        Zum Dashboard
      </GlassButton>
    </OnboardingLayout>
  );
}
