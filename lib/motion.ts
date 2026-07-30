import type { Variants, Transition } from 'framer-motion';

/* ───── Easing ───── */
export const EASE_CINEMATIC = [0.16, 1, 0.3, 1] as const;
export const EASE_SPRING = [0.32, 0.72, 0, 1] as const;

/* ───── Standard transitions ───── */
export const springTransition: Transition = {
  type: 'spring',
  stiffness: 120,
  damping: 20,
};

export const smoothTransition: Transition = {
  duration: 0.8,
  ease: EASE_CINEMATIC,
};

export const fastTransition: Transition = {
  duration: 0.4,
  ease: EASE_CINEMATIC,
};

/* ───── Fade / Slide Variants ───── */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: smoothTransition },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -30 },
  visible: { opacity: 1, y: 0, transition: smoothTransition },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: smoothTransition },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: smoothTransition },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 1.2 } },
};

/* ───── Scale ───── */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: EASE_CINEMATIC },
  },
};

/* ───── Stagger ───── */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
      ease: EASE_CINEMATIC,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_CINEMATIC },
  },
};

/* ───── Pulse / Glow ───── */
export const glowPulse = {
  animate: {
    opacity: [0.3, 0.6, 0.3],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  },
};

/* ───── Line / Divider ───── */
export const lineGrow: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 0.6, ease: EASE_CINEMATIC },
  },
};

/* ───── Slide carousel ───── */
export const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

/* ───── Hover presets ───── */
export const hoverLift = {
  whileHover: { y: -4, transition: { duration: 0.3, ease: EASE_CINEMATIC } },
};

export const hoverGlow = {
  whileHover: {
    scale: 1.03,
    transition: { duration: 0.3, ease: EASE_CINEMATIC },
  },
};

export const hoverTap = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.98 },
};
