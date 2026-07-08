import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  onClick?: () => void;
  className?: string;
}

export function BlurBackdrop({ onClick, className }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={cn(
        "fixed inset-0 z-40 bg-background/40 backdrop-blur-md",
        className,
      )}
    />
  );
}
