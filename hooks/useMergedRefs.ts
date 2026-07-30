import { useCallback, MutableRefObject, Ref } from 'react';

/**
 * Returns a callback ref that updates all provided refs.
 * Works with RefObject, callback refs, and null/undefined.
 */
export function useMergedRefs<T = unknown>(
  ...refs: Array<Ref<T | null>>
): (instance: T | null) => void {
  return useCallback((instance) => {
    for (const ref of refs) {
      if (ref == null) {
        continue;
      }
      if (typeof ref === 'function') {
        ref(instance);
      } else {
        // ref is a RefObject (could be from useRef)
        // We cast to MutableRefObject to write to .current
        (ref as MutableRefObject<T | null>).current = instance;
      }
    }
  }, refs);
}