import { forwardRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BlurBackdrop } from "@/components/glass/BlurBackdrop";
import { GlassButton } from "@/components/glass/GlassButton";
import { X } from "lucide-react";

export interface DialogCardProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export const DialogCard = forwardRef<HTMLDivElement, DialogCardProps>(
  function DialogCard(
    { open, onClose, title, description, children, actions, className },
    ref,
  ) {
    return (
      <AnimatePresence>
        {open && (
          <>
            <BlurBackdrop onClick={onClose} />
            <motion.div
              ref={ref}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? "dialog-title" : undefined}
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 340, damping: 32 }}
              className={cn(
                "glass-card hairline fixed left-1/2 top-1/2 z-50 w-[min(28rem,90vw)] -translate-x-1/2 -translate-y-1/2 p-5",
                className,
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {title && (
                    <h2 id="dialog-title" className="text-lg font-semibold tracking-tight">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                  )}
                </div>
                <GlassButton
                  size="sm"
                  variant="ghost"
                  aria-label="Schließen"
                  onClick={onClose}
                  className="!h-9 !w-9 !p-0"
                >
                  <X className="h-4 w-4" />
                </GlassButton>
              </div>
              {children && <div className="mt-4">{children}</div>}
              {actions && (
                <div className="mt-5 flex justify-end gap-2">{actions}</div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  },
);
