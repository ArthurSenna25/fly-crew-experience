'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useInView, motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import ContactForm from '@/components/landing/ContactForm';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useIsMobile } from '@/hooks/use-mobile';

export default function FinalCTASection() {
  // Diagnóstico de hidratação (temporário) — marca a PRIMEIRA renderização
  // do cliente. Guardado por ref para disparar uma única vez, nunca em
  // re-renders subsequentes. Fora de qualquer useEffect, conforme a
  // instrumentação solicitada. Nome 'final-cta-render-start' (único — não
  // reutiliza nenhuma mark já usada na página /).
  const finalCtaRenderMarkedRef = useRef(false);
  if (!finalCtaRenderMarkedRef.current) {
    finalCtaRenderMarkedRef.current = true;
    if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
      performance.mark('final-cta-render-start');
    }
  }

  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.25 });
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  // Parallax scroll-driven do background via rAF + transform direto no DOM
  // (fora do ciclo de render do React), no mesmo padrão do Navigation.tsx.
  // Substitui useScroll/useTransform do Framer Motion — 1 listener de scroll
  // + 1 de resize, batch de leitura antes da escrita, cleanup completo.
  // Mapa linear 0→15% em translateY preservado idêntico ao useTransform
  // anterior; gate reducedMotion || isMobile → '0%' fixo, sem listeners.
  const bgRef = useRef<HTMLDivElement>(null);
  const bgRafRef = useRef<number | null>(null);

  useEffect(() => {
    const bg = bgRef.current;
    if (!bg) return;

    // MESMO gate condicional que existia antes: mobile/reduced-motion não
    // animam e não casam listeners (economia de scroll listener + repaint).
    // Aplica '0%' uma vez para resetar caso o gate venha a flipar depois.
    if (reducedMotion || isMobile) {
      bg.style.transform = 'translateY(0%)';
      return;
    }

    const updateBg = () => {
      bgRafRef.current = null; // self-clear do handle (gate p/ próximo schedule)
      // Batch de leitura ANTES da escrita (mesma disciplina do Navigation):
      const rect = bg.getBoundingClientRect();
      // Fórmula do offset 'start end'/'end start':
      // progress=0 quando rect.top=innerHeight (alvo entra por baixo),
      // progress=1 quando rect.top=-rect.height (alvo sai por cima).
      const progress = Math.min(
        1,
        Math.max(0, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)),
      );
      // Escrita única, GPU-only, fora do render do React — mapa 0→15%:
      bg.style.transform = `translateY(${progress * 15}%)`;
    };

    const scheduleBg = () => {
      if (bgRafRef.current === null) {
        bgRafRef.current = requestAnimationFrame(updateBg);
      }
    };

    // Estado inicial (seção pode montar já parcialmente em viewport):
    updateBg();
    window.addEventListener('scroll', scheduleBg, { passive: true });
    window.addEventListener('resize', scheduleBg, { passive: true });
    return () => {
      window.removeEventListener('scroll', scheduleBg);
      window.removeEventListener('resize', scheduleBg);
      if (bgRafRef.current !== null) cancelAnimationFrame(bgRafRef.current);
    };
  }, [reducedMotion, isMobile]);

  // Diagnóstico de hidratação (temporário) — sinaliza que o mount efetivamente
  // terminou (passive effects rodaram). O delta real (mark → mount effects)
  // é calculado AQUI no cliente usando a mark 'final-cta-render-start'
  // criada no topo do componente, e enviado como msSinceMark — o servidor só
  // o exibe. (performance.now() é relativo à navegação da página; subtrair de
  // Date.now() epoch não representaria tempo real nenhum.) FinalCTASection não
  // tinha useEffect de mount pré-existente, então este foi criado novo.
  useEffect(() => {
    const markName = 'final-cta-render-start';
    const markEntry =
      typeof performance !== 'undefined' ? performance.getEntriesByName(markName)[0] : undefined;
    const msSinceMark = markEntry
      ? Math.round(performance.now() - markEntry.startTime)
      : null;

    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(
        '/api/debug-log',
        JSON.stringify({
          tag: 'FinalCTASection',
          msg: 'mount effects complete',
          msSinceMark,
        }),
      );
    } else {
      fetch('/api/debug-log', {
        method: 'POST',
        body: JSON.stringify({
          tag: 'FinalCTASection',
          msg: 'mount effects complete',
          msSinceMark,
        }),
        keepalive: true,
      });
    }
  }, []);

  return (
    <Section
      ref={sectionRef}
      sectionId="contact"
      bg="black"
      data-testid="final-cta-section"
      className="relative overflow-hidden isolate w-full max-w-full"
    >
      {/* Background — contido com overflow-hidden próprio como segunda barreira */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div ref={bgRef} className="absolute inset-0" style={{ transform: 'translateY(0%)' }}>
          <Image
            src="/images/finalCTA/final-cta-image.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-[0.07]"
          />
        </div>

        {/* Gradientes estáticos — mantidos, custo baixo */}
        <div className="absolute inset-0 bg-gradient-to-t from-executive-black via-executive-black/85 to-transparent" />

        {/* Blob 1 — escalado por breakpoint, blur reduzido no mobile */}
        <div
          className="absolute top-0 right-0
            w-[16rem] h-[16rem] blur-[50px]
            sm:w-[24rem] sm:h-[24rem] sm:blur-[100px]
            lg:w-[40rem] lg:h-[40rem] lg:blur-[180px]
            bg-gold-prestige/[0.035] rounded-full pointer-events-none"
        />

        {/* Blob 2 — só aparece a partir de sm; no mobile é peso puro sem ganho visual real */}
        <div
          className="hidden sm:block absolute bottom-0 left-0
            sm:w-[20rem] sm:h-[20rem] sm:blur-[90px]
            lg:w-[35rem] lg:h-[35rem] lg:blur-[140px]
            bg-white/[0.015] rounded-full pointer-events-none"
        />
      </div>

      <Container className="relative z-10 px-6 sm:px-8 lg:px-12">
        {/* HEADER CONTENT */}
        <div className="mb-16 text-center">
          <motion.p
            initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0, ease: [0.16, 1, 0.3, 1] }}
            className="text-xs uppercase tracking-[0.3em] text-gold-prestige font-semibold mb-6"
          >
            SUA JORNADA COMEÇA AQUI
          </motion.p>

          <h2 className="font-cinzel font-light text-white leading-[1.0] tracking-tight text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem] max-w-4xl mx-auto text-center mt-4">
            <motion.span
              className="block"
              initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              O Próximo Passo
            </motion.span>
            <motion.span
              className="block"
              initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              Entre Você e a Aviação
            </motion.span>
            <motion.span
              className="block text-gold-prestige"
              initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              Começa Agora.
            </motion.span>
          </h2>

          <motion.div
            initial={reducedMotion ? { scaleX: 1 } : { scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-16 h-px bg-gradient-to-r from-transparent via-gold-prestige to-transparent mx-auto my-8"
          />

          <motion.p
            initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="font-montserrat font-light text-silver-mist/70 text-sm sm:text-base leading-relaxed max-w-xl mx-auto text-center px-2 sm:px-0"
          >
            Mais do que uma preparação, a Fly Crew entrega uma experiência transformadora para quem
            deseja construir uma carreira com presença, confiança e excelência profissional.
          </motion.p>
        </div>

        {/* FORM AREA */}
        <motion.div
          initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mx-auto w-full"
        >
          <ContactForm className="bg-white/[0.025] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 sm:p-10 lg:p-14" />
        </motion.div>
      </Container>
    </Section>
  );
}
