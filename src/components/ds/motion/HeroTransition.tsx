import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { heroTransition } from "@/themes/motion";

export function HeroTransition({
  children,
  layoutId,
}: {
  children: ReactNode;
  layoutId?: string;
}) {
  return (
    <motion.div
      layoutId={layoutId}
      variants={heroTransition}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
