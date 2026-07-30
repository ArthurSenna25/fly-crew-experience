
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInViewSafe } from '../../hooks/use-in-view-safe';
import { toast } from 'sonner';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ContactFormProps {
  className?: string;
}

export default function ContactForm({ className = '' }: ContactFormProps) {
  // Diagnóstico de hidratação (temporário) — marca a PRIMEIRA renderização
  // do cliente. Guardado por ref para disparar uma única vez, nunca em
  // re-renders subsequentes. Fora de qualquer useEffect, conforme a
  // instrumentação solicitada. Fica antes do early return 'if (formState.success)'
  // para respeitar as Rules of Hooks. Nome 'contact-form-render-start' (único
  // — não reutiliza nenhuma mark já usada na página /).
  const contactFormRenderMarkedRef = useRef(false);
  if (!contactFormRenderMarkedRef.current) {
    contactFormRenderMarkedRef.current = true;
    if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
      performance.mark('contact-form-render-start');
    }
  }

  const [formState, setFormState] = useState({
    name: '',
    email: '',
    message: '',
    lgpd: false,
    submitting: false,
    success: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const reducedMotion = useReducedMotion();
  const formRef = useRef(null);
  const isInView = useInViewSafe(formRef, { once: true, amount: 0.25 });

  // Diagnóstico de hidratação (temporário) — sinaliza que o mount efetivamente
  // terminou (passive effects rodaram). O delta real (mark → mount effects)
  // é calculado AQUI no cliente usando a mark 'contact-form-render-start'
  // criada no topo do componente, e enviado como msSinceMark — o servidor só
  // o exibe. (performance.now() é relativo à navegação da página; subtrair de
  // Date.now() epoch não representaria tempo real nenhum.) ContactForm não
  // tinha useEffect de mount pré-existente, então este foi criado novo.
  // Posicionado antes do early return 'if (formState.success)' (Rules of Hooks).
  useEffect(() => {
    const markName = 'contact-form-render-start';
    const markEntry =
      typeof performance !== 'undefined' ? performance.getEntriesByName(markName)[0] : undefined;
    const msSinceMark = markEntry
      ? Math.round(performance.now() - markEntry.startTime)
      : null;

    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(
        '/api/debug-log',
        JSON.stringify({
          tag: 'ContactForm',
          msg: 'mount effects complete',
          msSinceMark,
        }),
      );
    } else {
      fetch('/api/debug-log', {
        method: 'POST',
        body: JSON.stringify({
          tag: 'ContactForm',
          msg: 'mount effects complete',
          msSinceMark,
        }),
        keepalive: true,
      });
    }
  }, []);

  const validateEmail = (email: string) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!formState.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formState.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!validateEmail(formState.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!formState.message.trim()) {
      newErrors.message = 'Mensagem é obrigatória';
    }

    if (!formState.lgpd) {
      newErrors.lgpd = 'É necessário concordar com a política de privacidade';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setFormState(prev => ({ ...prev, submitting: true }));

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Success
      setFormState({
        name: '',
        email: '',
        message: '',
        lgpd: false,
        submitting: false,
        success: true
      });

      toast.success('Mensagem enviada com sucesso!');
    }
  };

  if (formState.success) {
    return (
      <motion.div
        ref={formRef}
        initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ duration: 0.6, delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
        className="text-center bg-white/[0.02] border border-white/[0.05] rounded-2xl p-10 sm:p-14 backdrop-blur-sm"
      >
        <motion.span
          initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.5, delay: 0, ease: [0.16, 1, 0.3, 1] }}
          className="text-xs uppercase tracking-[0.3em] text-gold-prestige font-semibold mb-4 block"
        >
          Mensagem enviada
        </motion.span>

        <motion.span
          initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.5, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="font-montserrat font-light text-silver-mist/70 text-base leading-relaxed max-w-lg mx-auto text-center"
        >
          Obrigado por entrar em contato! Respondemos em até 24 horas.
        </motion.span>
      </motion.div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={`${className} bg-white/[0.02] border border-white/[0.05] rounded-2xl p-10 sm:p-14 backdrop-blur-sm`}
    >
      {/* Label */}
      <motion.span
        initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        transition={{ duration: 0.5, delay: 0, ease: [0.16, 1, 0.3, 1] }}
        className="text-xs uppercase tracking-[0.3em] text-gold-prestige font-semibold mb-6 block"
      >
        Fale Conosco
      </motion.span>

      {/* Name and Email - grid on sm+ */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Name Field */}
        <motion.div
          initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.4, delay: 0, ease: [0.16, 1, 0.3, 1] }}
        >
          <label
            htmlFor="name"
            className="block text-silver-mist/40 text-[0.65rem] tracking-[0.15em] uppercase font-montserrat mb-2"
          >
            Nome completo
          </label>
          <input
            id="name"
            type="text"
            value={formState.name}
            onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
            className={`${errors.name ? 'border-destructive/50' : ''} bg-white/5 border border-white/10 rounded-xl focus:border-gold-prestige/50 focus:outline-none focus:bg-white/8 text-white placeholder:text-silver-mist/40 px-5 py-3.5 font-montserrat text-sm transition-colors duration-200 w-full`}
            placeholder="Digite seu nome completo"
            required
          />
          {errors.name && <p className="mt-1 text-destructive text-sm">{errors.name}</p>}
        </motion.div>

        {/* Email Field */}
        <motion.div
          initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.4, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
        >
          <label
            htmlFor="email"
            className="block text-silver-mist/40 text-[0.65rem] tracking-[0.15em] uppercase font-montserrat mb-2"
          >
            E-mail
          </label>
          <input
            id="email"
            type="email"
            value={formState.email}
            onChange={(e) => setFormState((prev) => ({ ...prev, email: e.target.value }))}
            className={`${errors.email ? 'border-destructive/50' : ''} bg-white/5 border border-white/10 rounded-xl focus:border-gold-prestige/50 focus:outline-none focus:bg-white/8 text-white placeholder:text-silver-mist/40 px-5 py-3.5 font-montserrat text-sm transition-colors duration-200 w-full resize-none`}
            placeholder="seunome@exemplo.com"
            required
          />
          {errors.email && <p className="mt-1 text-destructive text-sm">{errors.email}</p>}
        </motion.div>
      </div>

      {/* Textarea */}
      <motion.div
        initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={{ duration: 0.4, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
      >
        <label
          htmlFor="message"
          className="block text-silver-mist/40 text-[0.65rem] tracking-[0.15em] uppercase font-montserrat mb-2"
        >
          Sua mensagem
        </label>
        <textarea
          id="message"
          rows={5}
          value={formState.message}
          onChange={(e) => setFormState((prev) => ({ ...prev, message: e.target.value }))}
          className={`${errors.message ? 'border-destructive/50' : ''} bg-white/5 border border-white/10 rounded-xl focus:border-gold-prestige/50 focus:outline-none focus:bg-white/8 text-white placeholder:text-silver-mist/40 px-5 py-3.5 font-montserrat text-sm transition-colors duration-200 w-full resize-none`}
          placeholder="Descreva sua dúvida ou solicitacao"
          required
        />
        {errors.message && <p className="mt-1 text-destructive text-sm">{errors.message}</p>}
      </motion.div>

      {/* LGPD Consent */}
      <motion.div
        initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={{ duration: 0.4, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-start space-x-3"
      >
        <input
          type="checkbox"
          id="lgpd"
          checked={formState.lgpd}
          onChange={(e) => setFormState((prev) => ({ ...prev, lgpd: e.target.checked }))}
          className="h-4 w-4 text-gold-prestige focus:ring-gold-prestige border-white/30 rounded"
        />
        <label
          htmlFor="lgpd"
          className="text-silver-mist/70 text-base font-montserrat leading-relaxed"
        >
          Concordo com a{' '}
          <a href="/privacy" className="text-gold-prestige underline">
            política de privacidade
          </a>{' '}
          e autorizo o uso dos meus dados para contato.
        </label>
        {errors.lgpd && <p className="mt-1 text-destructive text-sm">{errors.lgpd}</p>}
      </motion.div>

      {/* Submit Button */}
      <motion.div
        initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={{ duration: 0.4, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
      >
        <button
          type="submit"
          disabled={formState.submitting}
          className={`${formState.submitting ? 'opacity-50 cursor-not-allowed' : ''} w-full bg-gold-prestige text-executive-black font-semibold uppercase tracking-[0.25em] text-sm py-4 rounded-xl hover:bg-gold-prestige/90 transition-colors duration-150 ${!reducedMotion && 'hover:opacity-88'}`}
        >
          {formState.submitting ? 'Enviando...' : 'Envie sua mensagem'}
        </button>
      </motion.div>
    </form>
  );
}
