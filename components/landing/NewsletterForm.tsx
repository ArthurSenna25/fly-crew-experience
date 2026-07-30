'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export default function NewsletterForm() {
  // Diagnóstico de hidratação (temporário) — marca a PRIMEIRA renderização
  // do cliente. Guardado por ref para disparar uma única vez, nunca em
  // re-renders subsequentes. Fora de qualquer useEffect, conforme a
  // instrumentação solicitada. Nome 'newsletter-form-render-start' (único
  // — não reutiliza 'hero-', 'nav-', 'testimonials-', 'founders-' ou
  // 'workshops-render-start', que já existem na mesma página /).
  const newsletterRenderMarkedRef = useRef(false);
  if (!newsletterRenderMarkedRef.current) {
    newsletterRenderMarkedRef.current = true;
    if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
      performance.mark('newsletter-form-render-start');
    }
  }

  const [email, setEmail] = useState('');
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const onFocus = () => setIsFocused(true);
    const onBlur = () => setIsFocused(false);
    input.addEventListener('focus', onFocus);
    input.addEventListener('blur', onBlur);

    // Diagnóstico de hidratação (temporário) — sinaliza que o mount efetivamente
    // terminou (passive effects rodaram). O delta real (mark → mount effects)
    // é calculado AQUI no cliente usando a mark 'newsletter-form-render-start'
    // criada no topo do componente, e enviado como msSinceMark — o servidor só
    // o exibe. (performance.now() é relativo à navegação da página; subtrair de
    // Date.now() epoch não representaria tempo real nenhum.) Anexado ao
    // useEffect de mount já existente (focus/blur listeners) abaixo dos addEventListener.
    const markName = 'newsletter-form-render-start';
    const markEntry =
      typeof performance !== 'undefined' ? performance.getEntriesByName(markName)[0] : undefined;
    const msSinceMark = markEntry
      ? Math.round(performance.now() - markEntry.startTime)
      : null;

    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(
        '/api/debug-log',
        JSON.stringify({
          tag: 'NewsletterForm',
          msg: 'mount effects complete',
          msSinceMark,
        }),
      );
    } else {
      fetch('/api/debug-log', {
        method: 'POST',
        body: JSON.stringify({
          tag: 'NewsletterForm',
          msg: 'mount effects complete',
          msSinceMark,
        }),
        keepalive: true,
      });
    }

    return () => {
      input.removeEventListener('focus', onFocus);
      input.removeEventListener('blur', onBlur);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lgpdConsent) {
      toast.error('Você precisa concordar com a Política de Privacidade.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, lgpdConsent }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(
          res.status === 400 && data.error === 'Email already subscribed'
            ? 'Este email já está inscrito.'
            : 'Erro ao inscrever. Tente novamente.',
        );
        return;
      }
      toast.success('Inscrição realizada com sucesso!');
      setEmail('');
      setLgpdConsent(false);
      setSuccess(true);
    } catch {
      toast.error('Erro ao inscrever. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {!success ? (
        <motion.div
          key="form"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email input */}
            <div className="relative">
              <input
                ref={inputRef}
                type="email"
                placeholder="Digite seu melhor email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 font-montserrat text-sm text-white placeholder:text-silver-mist/40 focus:border-white/30 focus:outline-none transition-colors duration-200"
                data-testid="newsletter-email-input"
              />
              {/* Left focus accent */}
              {!reducedMotion && (
                <motion.div
                  className="absolute left-0 top-0 h-full w-[2px] rounded-l-xl bg-white/30 origin-top"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: isFocused ? 1 : 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                />
              )}
            </div>

            {/* Submit */}
            {/*
              Nota sobre o hover: `hover:` puro em CSS "gruda" em iOS
              Safari depois de um toque (o navegador simula :hover ao
              tocar, e ele só sai quando a pessoa toca em outro lugar).
              Isso fazia o botão parecer travado em 88% de opacidade
              após o toque no celular. O seletor arbitrário
              `[@media(hover:hover)]:hover:...` restringe o efeito de
              hover só a dispositivos que realmente têm mouse — em
              touch, só o `active:` (que solta no touchend) entra em
              ação, dando o feedback de toque sem grudar.
            */}
            <motion.button
              type="submit"
              disabled={submitting}
              className="w-full bg-white text-executive-black font-semibold uppercase tracking-[0.2em] text-sm py-4 rounded-xl transition-opacity duration-150 [@media(hover:hover)]:hover:opacity-[0.88] active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="newsletter-submit-btn"
            >
              {submitting ? 'Inscrevendo...' : 'Quero Fazer Parte'}
            </motion.button>

            {/* LGPD */}
            <label className="flex items-start gap-2 text-[0.68rem] text-silver-mist/50 cursor-pointer">
              <input
                type="checkbox"
                checked={lgpdConsent}
                onChange={(e) => setLgpdConsent(e.target.checked)}
                required
                className="mt-0.5 flex-shrink-0 accent-gold-prestige"
              />
              <span>
                Aceito receber comunicações por email e concordo com a{' '}
                <a href="/privacy" target="_blank" className="text-gold-prestige hover:underline">
                  Política de Privacidade
                </a>
                .
              </span>
            </label>
          </form>
        </motion.div>
      ) : (
        <motion.div
          key="success"
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-3"
        >
          <p className="font-cinzel font-light text-gold-prestige text-2xl">
            ✦ Bem-vinda à comunidade.
          </p>
          <p className="font-montserrat text-silver-mist/80 text-base">
            Você receberá nossas novidades em breve.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
