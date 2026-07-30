'use client';

import { forwardRef, useRef } from 'react';
import { motion, useInView, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { EASE_CINEMATIC } from '@/lib/motion';

interface StaggerGridProps extends HTMLMotionProps<'div'> {
  /** Delay between each child animation */
  staggerDelay?: number;
  /** Initial delay before staggering starts */
  initialDelay?: number;
  /** Animation direction for children */
  direction?: 'up' | 'left' | 'right';
  /** Only trigger once */
  once?: boolean;
}

/**
 * Grid container with staggered fade-in animations for children.
 * Children are wrapped individually — no need to add motion.div to each child.
 */
export const StaggerGrid = forwardRef<HTMLDivElement, StaggerGridProps>(
  (
    {
      children,
      className,
      staggerDelay = 0.1,
      initialDelay = 0.1,
      direction = 'up',
      once = true,
      ...props
    },
    forwardedRef,
  ) => {
    const internalRef = useRef<HTMLDivElement | null>(null);
    const isInView = useInView(internalRef, {
      once,
      margin: '-100px',
    });

    const getHidden = () => {
      switch (direction) {
        case 'left':
          return { opacity: 0, x: -30 };
        case 'right':
          return { opacity: 0, x: 30 };
        default:
          return { opacity: 0, y: 30 };
      }
    };

    return (
      <motion.div
        ref={forwardedRef || internalRef}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: staggerDelay,
              delayChildren: initialDelay,
            },
          },
        }}
        className={cn(className)}
        {...props}
      >
        {Array.isArray(children)
          ? children.map((child, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: getHidden(),
                  visible: {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    transition: {
                      duration: 0.6,
                      ease: EASE_CINEMATIC,
                    },
                  },
                }}
              >
                {child}
              </motion.div>
            ))
          : children}
      </motion.div>
    );
  },
);

StaggerGrid.displayName = 'StaggerGrid';