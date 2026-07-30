'use client';

import { type ImgHTMLAttributes, forwardRef, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useInViewSafe } from '@/hooks/use-in-view-safe';
import { useMergedRefs } from '@/hooks/useMergedRefs';

interface ParallaxImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'children'> {
  src: string;
  alt: string;
  /** Parallax intensity in pixels (default: 200) */
  speed?: number;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain';
  rounded?: string;
}

export const ParallaxImage = forwardRef<HTMLDivElement, ParallaxImageProps>(
  (
    {
      src,
      alt,
      speed = 200,
      aspectRatio = '3/4',
      objectFit = 'cover',
      rounded = 'rounded-2xl',
      className,
      ...props
    },
    forwardedRef,
  ) => {
    const internalRef = useRef<HTMLDivElement | null>(null);
    const reducedMotion = useReducedMotion();

    const { scrollYProgress } = useScroll({
      target: internalRef,
      offset: ['start end', 'end start'],
    });

    const yRaw = useTransform(scrollYProgress, [0, 1], [speed / 2, -speed / 2]);
    const scaleRaw = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1, 1.1]);
    const y = reducedMotion ? 0 : yRaw;
    const scale = reducedMotion ? 1 : scaleRaw;
    const isInView = useInViewSafe(internalRef, { once: true, margin: '-100px' });

    const mergedRef = useMergedRefs<HTMLDivElement>(forwardedRef, internalRef);

    return (
      <motion.div
        ref={mergedRef}
        initial={reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
        animate={isInView ? { opacity: 1, scale: 1 } : (reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 })}
        transition={{ duration: reducedMotion ? 0 : 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`group relative overflow-hidden ${rounded} ${className || ''} transition-transform duration-300 hover:scale-[1.02]`}
        style={{ aspectRatio }}
      >
        <motion.div ref={internalRef} className="absolute inset-0" style={{ y, scale }}>
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className={`object-${objectFit}`}
          />
        </motion.div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-executive-black via-executive-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-gold-prestige/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        {/* Border */}
        <div
          className={`absolute inset-0 ${rounded} border border-white/10 group-hover:border-gold-prestige/30 transition-colors duration-700`}
        />
      </motion.div>
    );
  },
);

ParallaxImage.displayName = 'ParallaxImage';