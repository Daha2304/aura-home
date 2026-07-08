import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OnboardingLayoutProps {
  children: ReactNode;
  step?: number;
  totalSteps?: number;
  className?: string;
}

export function OnboardingLayout({
  children,
  step,
  totalSteps,
  className,
}: OnboardingLayoutProps) {
  const reduce = useReducedMotion();
  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      {/* Ambient blur background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          aria-hidden
          className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-primary/40 blur-3xl"
          animate={
            reduce ? undefined : { x: [0, 40, -20, 0], y: [0, -20, 30, 0] }
          }
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute -bottom-32 -right-24 h-[520px] w-[520px] rounded-full bg-accent/30 blur-3xl"
          animate={
            reduce ? undefined : { x: [0, -30, 20, 0], y: [0, 30, -20, 0] }
          }
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute top-1/3 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-info/20 blur-3xl"
          animate={reduce ? undefined : { opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div
        className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-[max(env(safe-area-inset-top),2rem)]"
      >
        {typeof step === "number" && typeof totalSteps === "number" && (
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Schritt {step} von {totalSteps}
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <motion.span
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full",
                    i < step ? "bg-primary" : "bg-white/15",
                  )}
                  initial={false}
                  animate={{ width: i === step - 1 ? 24 : 8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 26 }}
                />
              ))}
            </div>
          </div>
        )}
        <div className={cn("flex flex-1 flex-col", className)}>{children}</div>
      </div>
    </div>
  );
}
