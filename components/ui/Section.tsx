'use client';

import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface SectionProps extends HTMLAttributes<HTMLElement> {
  /** Section HTML id (for scroll navigation) */
  sectionId?: string;
  /** Background variant */
  bg?: 'black' | 'midnight' | 'transparent';
  /** Remove default vertical padding */
  noPadding?: boolean;
}

const bgStyles: Record<string, string> = {
  black: 'bg-executive-black',
  midnight: 'bg-midnight-premium/30',
  transparent: 'bg-transparent',
};

/**
 * Section layout primitive.
 * Wraps padding, background, overflow-hidden, and id.
 * Replaces the repeated `py-24 sm:py-32 lg:py-40 bg-... relative overflow-hidden` pattern.
 */
export const Section = forwardRef<HTMLElement, SectionProps>(
  ({ className, children, sectionId, bg = 'black', noPadding, ...props }, ref) => {
    return (
      <section
        ref={ref}
        id={sectionId}
        className={cn(
          'relative',
          bgStyles[bg],
          !noPadding && 'py-24 sm:py-32 lg:py-40',
          className,
        )}
        {...props}
      >
        {children}
      </section>
    );
  },
);

Section.displayName = 'Section';