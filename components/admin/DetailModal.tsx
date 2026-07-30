'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DetailModal({ isOpen, onClose, title, children }: Props) {
  const reducedMotion = useReducedMotion();
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  // ── Lock body scroll quando aberto ──────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  // ── Fechar com Escape ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      // CRÍTICO: só fecha se o foco NÃO estiver num campo editável.
      // Isso previne o bug de Backspace/Delete fechar o modal acidentalmente
      // (o Escape ainda funciona, mas Backspace em input/textarea/select não).
      if (e.key === 'Escape') {
        const active = document.activeElement;
        const isEditing =
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement ||
          active instanceof HTMLSelectElement ||
          (active instanceof HTMLElement && active.isContentEditable);

        // Se estiver editando, Escape limpa o campo mas não fecha o modal
        // (comportamento padrão do browser — não interferimos)
        if (!isEditing) {
          e.preventDefault();
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // ── Foco inicial no container do modal (não no botão X) ─────────────────────
  useEffect(() => {
    if (!isOpen) return;
    // Aguarda a animação de entrada antes de mover o foco,
    // evitando que o botão X roube o foco logo de cara
    const timer = setTimeout(() => {
      modalRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // ── Indicador de scroll ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const el = contentRef.current;
    if (!el) return;

    const update = () => {
      setShowScrollHint(el.scrollHeight - el.scrollTop - el.clientHeight > 8);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [isOpen, children]);

  // ── Backdrop click: fecha só se o clique foi DIRETAMENTE no backdrop ─────────
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // e.target === e.currentTarget garante que não foi um clique borbulhado
    // de algum filho (input, button, textarea, etc.)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.05 : 0.2 }}
            className="fixed inset-0 bg-executive-black/80 backdrop-blur-sm"
            style={{ zIndex: 'var(--z-modal-backdrop)' }}
            // Não coloca onClick aqui — o wrapper abaixo trata isso com
            // verificação de target para evitar fechamento acidental
            aria-hidden="true"
          />

          {/* ── Wrapper de posicionamento (captura clique fora do modal) ── */}
          <motion.div
            key="modal-wrapper"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            transition={{
              duration: reducedMotion ? 0.05 : 0.28,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex: 'var(--z-modal-dialog)' }}
            onClick={handleBackdropClick}
          >
            {/* ── Caixa do modal ── */}
            <div
              ref={modalRef}
              tabIndex={-1} // recebe foco programático mas não entra no tab order
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              data-testid="detail-modal"
              // stopPropagation aqui: cliques DENTRO do modal não chegam
              // ao wrapper acima e não disparam o fechamento
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden outline-none"
              style={{
                background: 'rgba(14,14,14,0.92)',
                backdropFilter: 'blur(40px) saturate(1.5)',
                WebkitBackdropFilter: 'blur(40px) saturate(1.5)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderTop: '1px solid rgba(255,255,255,0.18)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.05) inset',
                borderRadius: '1.25rem',
              }}
            >
              {/* ── Header ── */}
              <div
                className="flex items-center justify-between px-6 py-5 shrink-0"
                style={{
                  background: 'rgba(10,10,10,0.80)',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <h2
                  id="modal-title"
                  className="font-semibold leading-none"
                  style={{
                    fontSize: '1.125rem',
                    color: '#F7F7F5',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {title}
                </h2>

                {/* Botão X: type="button" previne submit acidental de forms dentro do modal */}
                <button
                  type="button"
                  onClick={onClose}
                  data-testid="modal-close-btn"
                  aria-label="Fechar"
                  className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-150"
                  style={{ color: '#6B7280' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = '#AEB7C1';
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(255,255,255,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = '#6B7280';
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* ── Conteúdo scrollável ── */}
              <div className="relative flex-1 min-h-0 overflow-hidden">
                <div
                  ref={contentRef}
                  className="overflow-y-auto px-6 py-6 h-full"
                  style={{ maxHeight: 'calc(90vh - 74px)' }}
                >
                  {children}
                </div>

                {/* Gradiente de scroll hint */}
                <AnimatePresence>
                  {showScrollHint && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="pointer-events-none absolute bottom-0 left-0 right-0 h-8"
                      style={{
                        background: 'linear-gradient(to top, rgba(14,14,14,0.85), transparent)',
                      }}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
