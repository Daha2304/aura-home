import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { pageTransition } from "@/themes/motion";

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full"
    >
      {children}
    </motion.div>
  );
}
