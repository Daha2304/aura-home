import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Lightbulb, Lock, Zap } from "lucide-react";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { GlassButton } from "@/components/glass/GlassButton";

export const Route = createFileRoute("/onboarding/intro")({
  component: IntroScreen,
});

const slides = [
  {
    icon: Lightbulb,
    title: "Alles im Blick",
    body: "Räume, Geräte und Szenen an einem Ort – schnell erreichbar, überall.",
  },
  {
    icon: Zap,
    title: "Blitzschnell",
    body: "Native Performance, weiche Animationen, offlinefähig als PWA.",
  },
  {
    icon: Lock,
    title: "Deine Daten",
    body: "Verbindet sich direkt zu deinem Server – keine Cloud, keine Zwischenschicht.",
  },
];

function IntroScreen() {
  const navigate = useNavigate();
  return (
    <OnboardingLayout step={1} totalSteps={5}>
      <div className="flex flex-1 flex-col justify-center gap-3">
        {slides.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 + 0.05, type: "spring", stiffness: 220, damping: 24 }}
            className="glass-card flex items-start gap-3 p-4"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
              <s.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[15px] font-semibold">{s.title}</div>
              <div className="text-sm text-muted-foreground">{s.body}</div>
            </div>
          </motion.div>
        ))}
      </div>
      <GlassButton
        variant="primary"
        size="lg"
        className="mt-6 w-full"
        onClick={() => navigate({ to: "/onboarding/server" })}
      >
        Weiter
      </GlassButton>
    </OnboardingLayout>
  );
}
