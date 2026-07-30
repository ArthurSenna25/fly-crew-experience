'use client';

import { useRef } from 'react';
import { useInView, type UseInViewOptions } from 'framer-motion';

interface ScrollRevealResult {
  ref: React.RefObject<HTMLElement>;
  isInView: boolean;
}

/**
 * Standard scroll-reveal hook used across all landing sections.
 * Wraps the common `useRef` + `useInView` pattern.
 *
 * @param options - Optional useInView overrides
 * @param options.once - Default true — only trigger once
 * @param options.margin - Default "-100px" — trigger slightly before element enters
 */
export function useScrollReveal(options?: UseInViewOptions): ScrollRevealResult {
  const ref = useRef<HTMLElement | null>(null);
  const isInView = useInView(ref, {
    once: true,
    margin: '-100px',
    ...options,
  });

  return { ref, isInView };
}