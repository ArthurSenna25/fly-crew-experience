import { useEffect, useRef } from 'react';

/**
 *;

/**
 * Creates a portal div in document.body and returns its ref.
 * The div is created once and appended/removed from body on mount/unmount.
 *
 * @returns RefObject<HTMLDivElement> - ref to the portal div
 */
export function usePortal() {
  const modalRootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!modalRootRef.current) {
      modalRootRef.current = document.createElement('div');
      document.body.appendChild(modalRootRef.current);
    }
    return () => {
      if (modalRootRef.current) {
        document.body.removeChild(modalRootRef.current);
        modalRootRef.current = null;
      }
    };
  }, []);

  return modalRootRef;
}