import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode } from "react";
import { BlurBackdrop } from "./BlurBackdrop";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  className?: string;
}

export function GlassSheet({ open, onClose, title, children, className }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <BlurBackdrop onClick={onClose} />
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className={cn(
              "glass-sheet fixed inset-x-0 bottom-0 z-50 max-h-[90dvh] overflow-y-auto",
              "px-5 pt-3 pb-[max(env(safe-area-inset-bottom),1.25rem)]",
              className,
            )}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-foreground/25" />
            {title && (
              <h2 className="mb-4 text-center text-lg font-semibold tracking-tight">
                {title}
              </h2>
            )}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
