'use client';

import { forwardRef, useRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { useInViewSafe } from '@/hooks/use-in-view-safe';
import { cn } from '@/lib/utils';
import { EASE_CINEMATIC } from '@/lib/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ScrollRevealProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
  delay?: number;
  duration?: number;
  once?: boolean;
  margin?: `${number}px` | `${number}%` | `${number}px ${number}px ${number}px ${number}px`;
}

const directionVariants = {
  up: { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } },
  down: { hidden: { opacity: 0, y: -30 }, visible: { opacity: 1, y: 0 } },
  left: { hidden: { opacity: 0, x: -50 }, visible: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: 50 }, visible: { opacity: 1, x: 0 } },
  fade: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
};

export const ScrollReveal = forwardRef<HTMLDivElement, ScrollRevealProps>(
  (
    {
      children,
      className,
      direction = 'up',
      delay = 0,
      duration = 0.8,
      once = true,
      margin = '-100px',
      ...props
    },
    forwardedRef,
  ) => {
    const internalRef = useRef<HTMLDivElement | null>(null);
    const isInView = useInViewSafe(internalRef, { once, margin });
    const reducedMotion = useReducedMotion();

    const variant = directionVariants[direction as keyof typeof directionVariants];
    const hidden = reducedMotion ? { opacity: 1 } : variant.hidden;
    const visible = reducedMotion
      ? { opacity: 1, transition: { duration: 0 } }
      : { ...variant.visible, transition: { duration, delay, ease: EASE_CINEMATIC } };

    return (
      <motion.div
        ref={forwardedRef || internalRef}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={{ hidden, visible }}
        className={cn('will-change-transform', className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);

ScrollReveal.displayName = 'ScrollReveal';
