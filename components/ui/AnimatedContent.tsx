'use client';

import { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { fadeInUp, fadeInLeft, fadeInRight, fadeIn } from '@/lib/motion';

interface AnimatedContentProps extends HTMLMotionProps<'div'> {
  /** Animation variant preset */
  variant?: 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'fadeIn';
  /** Delay in seconds */
  delay?: number;
  /** Render as motion.div (default) or motion.section */
  as?: 'div' | 'section';
}

const variants = {
  fadeInUp,
  fadeInLeft,
  fadeInRight,
  fadeIn,
};

/**
 * Simple animated content wrapper with preset variants.
 * Prefer ScrollReveal for scroll-triggered animations.
 * Use AnimatedContent for entrance-only/initial mount animations.
 */
export const AnimatedContent = forwardRef<HTMLDivElement, AnimatedContentProps>(
  ({ children, className, variant = 'fadeInUp', delay = 0, as = 'div', ...props }, ref) => {
    const MotionTag = as === 'section' ? motion.section : motion.div;

    return (
      <MotionTag
        ref={ref}
        initial="hidden"
        animate="visible"
        variants={variants[variant]}
        className={cn('will-change-transform', className)}
        {...props}
      >
        {children}
      </MotionTag>
    );
  },
);

AnimatedContent.displayName = 'AnimatedContent';
