'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import ModalBase from './ModalBase';

type ConfirmationVariant = 'critical' | 'danger';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  variant?: ConfirmationVariant;
}

const VARIANT_STYLES: Record<
  ConfirmationVariant,
  {
    accent: string;
    accentBg: string;
    confirmBg: string;
    confirmText: string;
    confirmShadow: string;
  }
> = {
  critical: {
    accent: '#D4AF37',
    accentBg: 'rgba(212,175,55,0.12)',
    confirmBg: '#D4AF37',
    confirmText: '#0A0A0A',
    confirmShadow: '0 2px 12px rgba(212,175,55,0.35)',
  },
  danger: {
    accent: '#F87171',
    accentBg: 'rgba(248,113,113,0.12)',
    confirmBg: '#F87171',
    confirmText: '#0A0A0A',
    confirmShadow: '0 2px 12px rgba(248,113,113,0.35)',
  },
};

export default function ConfirmationModal({
  isOpen,
  onClose,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  loading: loadingProp,
  variant = 'critical',
}: ConfirmationModalProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  // Controlled from outside when provided, self-managed otherwise.
  const loading = loadingProp ?? internalLoading;
  const styles = VARIANT_STYLES[variant];

  // Clear stale error/loading whenever a fresh confirmation opens
  // (e.g. reused across different rows in a table).
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setInternalLoading(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setError(null);
    if (loadingProp === undefined) setInternalLoading(true);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado. Tente novamente.');
    } finally {
      if (loadingProp === undefined) setInternalLoading(false);
    }
  };

  const handleCancel = () => {
    onCancel();
    onClose();
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      isClosable={!loading}
      role="alertdialog"
      ariaLabelledBy={titleId}
      ariaDescribedBy={descriptionId}
      initialFocusRef={cancelRef}
    >
      <div className="p-6 sm:p-7">
        <div className="flex gap-4">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: styles.accentBg }}
            aria-hidden="true"
          >
            <AlertTriangle size={20} color={styles.accent} strokeWidth={2} />
          </div>

          <div className="min-w-0 pt-0.5">
            <h2
              id={titleId}
              className="text-[1.125rem] font-medium text-[#F7F7F5] leading-snug"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {title}
            </h2>
            <p
              id={descriptionId}
              className="mt-1.5 text-[0.875rem] text-[#AEB7C1] leading-relaxed"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {description}
            </p>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 text-[0.8125rem] leading-relaxed rounded-[10px] px-3 py-2"
            style={{
              color: '#F87171',
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.2)',
            }}
          >
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
          <button
            ref={cancelRef}
            onClick={handleCancel}
            disabled={loading}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 text-sm font-medium hover:bg-white/10 hover:text-[#F7F7F5] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#AEB7C1',
              borderRadius: '10px',
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 text-sm font-medium hover:brightness-110 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:brightness-100 inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0e0e0e]"
            style={{
              background: styles.confirmBg,
              color: styles.confirmText,
              borderRadius: '10px',
              boxShadow: styles.confirmShadow,
            }}
          >
            {loading && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            {loading ? 'Processando...' : confirmText}
          </button>
        </div>
      </div>
    </ModalBase>
  );
}
