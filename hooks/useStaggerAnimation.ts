'use client';

import type { Variants } from 'framer-motion';
import { EASE_CINEMATIC } from '@/lib/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface StaggerConfig {
  staggerDelay?: number;
  initialDelay?: number;
  direction?: 'up' | 'left' | 'right';
}

interface StaggerAnimationResult {
  containerVariants: Variants;
  itemVariants: Variants;
}

export function useStaggerAnimation(config?: StaggerConfig): StaggerAnimationResult {
  const reducedMotion = useReducedMotion();
  const staggerDelay = config?.staggerDelay ?? 0.1;
  const initialDelay = config?.initialDelay ?? 0.1;
  const direction = config?.direction ?? 'up';

  const getHiddenOffset = (): { x?: number; y?: number } => {
    if (reducedMotion) return {};
    switch (direction) {
      case 'left':
        return { x: -30 };
      case 'right':
        return { x: 30 };
      case 'up':
      default:
        return { y: 30 };
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: reducedMotion ? 1 : 0 },
    visible: {
      opacity: 1,
      transition: reducedMotion
        ? { duration: 0 }
        : {
            staggerChildren: staggerDelay,
            delayChildren: initialDelay,
            ease: EASE_CINEMATIC,
          },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: reducedMotion ? 1 : 0, ...getHiddenOffset() },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: reducedMotion ? 0 : 0.6, ease: EASE_CINEMATIC },
    },
  };

  return { containerVariants, itemVariants };
}