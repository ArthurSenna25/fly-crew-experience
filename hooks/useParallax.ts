'use client';

import { useRef } from 'react';
import { useScroll, useTransform, type MotionValue } from 'framer-motion';

interface ParallaxOptions {
  /** Offset array: [start, end] relative to viewport. Default: ['start end', 'end start'] */
  offset?: NonNullable<Parameters<typeof useScroll>[0]>['offset'];
  /** Output range for Y transform. Default: [0, 200] — image moves down 200px on scroll */
  outputRange?: [number, number];
}

interface ParallaxResult {
  ref: React.RefObject<HTMLElement | null>;
  scrollYProgress: MotionValue<number>;
  y: MotionValue<number>;
  scale: MotionValue<number>;
}

/**
 * Creates a parallax scroll effect with Y transform and subtle scale.
 * Used for background images and hero sections.
 */
export function useParallax(options?: ParallaxOptions): ParallaxResult {
  const ref = useRef<HTMLElement | null>(null);
  const offset = options?.offset ?? ['start end', 'end start'];
  const yRange = options?.outputRange ?? [0, 200];
  const scaleRange = [1.1, 1, 1.1];

  const { scrollYProgress } = useScroll({
    target: ref,
    offset,
  });

  const y = useTransform(scrollYProgress, [0, 1], yRange);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], scaleRange);

  return { ref, scrollYProgress, y, scale };
}