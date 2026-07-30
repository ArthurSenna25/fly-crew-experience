'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  isClosable?: boolean;
  /** ARIA role for the dialog element. Use 'alertdialog' for confirmation/destructive prompts. */
  role?: 'dialog' | 'alertdialog';
  /** id of the element that labels the dialog (usually the title) */
  ariaLabelledBy?: string;
  /** id of the element that describes the dialog (usually the body text) */
  ariaDescribedBy?: string;
  /**
   * Element to focus when the dialog opens, instead of the dialog container.
   * Useful for confirmation dialogs where focus should default to a safe
   * action (e.g. Cancel) rather than the dialog wrapper itself.
   */
  initialFocusRef?: React.RefObject<HTMLElement>;
}

export default function ModalBase({
  isOpen,
  onClose,
  children,
  isClosable = true,
  role = 'dialog',
  ariaLabelledBy,
  ariaDescribedBy,
  initialFocusRef,
}: ModalBaseProps) {
  const reducedMotion = useReducedMotion();
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  // Handle Escape key to close modal (if closable and not in editable field)
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isClosable) {
        const active = document.activeElement;
        const isEditing =
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement ||
          active instanceof HTMLSelectElement ||
          (active instanceof HTMLElement && active.isContentEditable);

        if (!isEditing) {
          e.preventDefault();
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, isClosable, onClose]);

  // Handle backdrop click to close modal (if closable)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isOpen && isClosable && e.target === e.currentTarget) {
      onClose();
    }
  };

  // Set initial focus when opened: prefer an explicit target (e.g. the Cancel
  // button in a destructive confirmation), fall back to the dialog container.
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      (initialFocusRef?.current ?? modalRef.current)?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen, initialFocusRef]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.05 : 0.2 }}
            className="fixed inset-0 bg-executive-black/80 backdrop-blur-sm"
            style={{ zIndex: 'var(--z-modal-backdrop)' }}
            aria-hidden="true"
          />

          {/* Wrapper (handles clicks on backdrop) */}
          <motion.div
            key="modal-wrapper"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            transition={{
              duration: reducedMotion ? 0.05 : 0.3,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex: 'var(--z-modal-dialog)' }}
            onClick={handleBackdropClick}
          >
            {/* Dialog content */}
            <div
              ref={modalRef}
              tabIndex={-1}
              role={role}
              aria-modal="true"
              aria-labelledby={ariaLabelledBy}
              aria-describedby={ariaDescribedBy}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden outline-none"
              style={{
                background: 'rgba(14,14,14,0.85)',
                backdropFilter: 'blur(40px) saturate(1.5)',
                WebkitBackdropFilter: 'blur(40px) saturate(1.5)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderTop: '1px solid rgba(255,255,255,0.20)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
                borderRadius: '1.25rem',
              }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
