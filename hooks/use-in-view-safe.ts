import { useInView, UseInViewOptions } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

/**
 * Custom hook that enhances framer-motion's useInView with a manual
 * position-check fallback (for the iOS WebKit cold-load freeze bug),
 * WITHOUT breaking legitimate scroll-triggered reveals for content
 * that hasn't been scrolled to yet.
 */
export function useInViewSafe(ref: React.RefObject<Element>, options?: UseInViewOptions): boolean {
  const isInView = useInView(ref, options);
  const hasEverBeenVisible = useRef(false);
  const [safeInView, setSafeInView] = useState(false);

  // Normal path: framer-motion's IntersectionObserver reports true.
  useEffect(() => {
    if (isInView) {
      hasEverBeenVisible.current = true;
      setSafeInView(true);
    }
  }, [isInView]);

  // Fallback path: only for the WebKit-freeze case, where the element
  // is ALREADY inside (or entering) the viewport but the observer
  // hasn't fired. We check the *real* position instead of trusting a
  // fixed timer, so content that's genuinely still off-screen is left
  // alone until the user actually scrolls to it.
  useEffect(() => {
    if (hasEverBeenVisible.current) return;

    const checkRealPosition = () => {
      if (hasEverBeenVisible.current || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const isActuallyVisible = rect.top < window.innerHeight && rect.bottom > 0;
      if (isActuallyVisible) {
        hasEverBeenVisible.current = true;
        setSafeInView(true);
      }
    };

    // Catches above-the-fold content stuck by the WebKit freeze right after load.
    const raf = requestAnimationFrame(checkRealPosition);

    // Catches the moment WebKit "wakes up" the observer on first user gesture.
    const events: (keyof WindowEventMap)[] = ['touchstart', 'scroll', 'pointerdown', 'wheel'];
    events.forEach((e) =>
      window.addEventListener(e, checkRealPosition, { once: true, passive: true }),
    );

    return () => {
      cancelAnimationFrame(raf);
      events.forEach((e) => window.removeEventListener(e, checkRealPosition));
    };
  }, []);

  return safeInView;
}
