import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cardTransition } from "@/themes/motion";

export function CardTransition({
  children,
  layoutId,
  className,
}: {
  children: ReactNode;
  layoutId?: string;
  className?: string;
}) {
  return (
    <motion.div
      layoutId={layoutId}
      variants={cardTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}
