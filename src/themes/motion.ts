import type { Transition, Variants } from "framer-motion";

export const springSoft: Transition = {
  type: "spring",
  stiffness: 220,
  damping: 26,
  mass: 0.9,
};

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 32,
  mass: 0.7,
};

export const springBouncy: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 20,
};

export const easeIOS: Transition = {
  duration: 0.35,
  ease: [0.22, 1, 0.36, 1],
};

export const fadeSlideUp: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: easeIOS },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export const fade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1, transition: springSnappy },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.18 } },
};

export const swipeIn: Variants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0, transition: easeIOS },
  exit: { opacity: 0, x: -24, transition: { duration: 0.2 } },
};

export const scalePress = {
  whileTap: { scale: 0.96 },
  transition: springSnappy,
} as const;

export const hoverLift = {
  whileHover: { y: -2 },
  transition: springSoft,
} as const;

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 10, filter: "blur(6px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -6,
    filter: "blur(4px)",
    transition: { duration: 0.2 },
  },
};

export const heroTransition: Variants = {
  initial: { opacity: 0, scale: 0.98, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: springSoft },
  exit: { opacity: 0, scale: 0.99, transition: { duration: 0.2 } },
};

export const cardTransition: Variants = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: easeIOS },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.15 } },
};

export const staggerChildren = (delay = 0.04): Variants => ({
  animate: { transition: { staggerChildren: delay } },
});
