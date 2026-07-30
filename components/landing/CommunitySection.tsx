'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInViewSafe } from '../../hooks/use-in-view-safe';
import { Section } from '@/components/ui/Section';
import { Container } from '@/components/ui/Container';
import NewsletterForm from '@/components/landing/NewsletterForm';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const bullets = [
  'Comunidade exclusiva de profissionais',
  'Conteúdo antecipado sobre eventos',
  'Acesso direto às fundadoras',
];

export default function CommunitySection() {
  // Diagnóstico de hidratação (temporário) — marca a PRIMEIRA renderização
  // do cliente. Guardado por ref para disparar uma única vez, nunca em
  // re-renders subsequentes. Fora de qualquer useEffect, conforme a
  // instrumentação solicitada. Nome 'community-render-start' (único — não
  // reutiliza nenhuma mark já usada na página /).
  const communityRenderMarkedRef = useRef(false);
  if (!communityRenderMarkedRef.current) {
    communityRenderMarkedRef.current = true;
    if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
      performance.mark('community-render-start');
    }
  }

  const ref = useRef<HTMLElement>(null);
  const inView = useInViewSafe(ref, { once: true, amount: 0.25 });
  const reducedMotion = useReducedMotion();

  // Diagnóstico de hidratação (temporário) — sinaliza que o mount efetivamente
  // terminou (passive effects rodaram). O delta real (mark → mount effects)
  // é calculado AQUI no cliente usando a mark 'community-render-start'
  // criada no topo do componente, e enviado como msSinceMark — o servidor só
  // o exibe. (performance.now() é relativo à navegação da página; subtrair de
  // Date.now() epoch não representaria tempo real nenhum.) CommunitySection
  // não tinha useEffect de mount pré-existente, então este foi criado novo.
  useEffect(() => {
    const markName = 'community-render-start';
    const markEntry =
      typeof performance !== 'undefined' ? performance.getEntriesByName(markName)[0] : undefined;
    const msSinceMark = markEntry
      ? Math.round(performance.now() - markEntry.startTime)
      : null;

    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(
        '/api/debug-log',
        JSON.stringify({
          tag: 'CommunitySection',
          msg: 'mount effects complete',
          msSinceMark,
        }),
      );
    } else {
      fetch('/api/debug-log', {
        method: 'POST',
        body: JSON.stringify({
          tag: 'CommunitySection',
          msg: 'mount effects complete',
          msSinceMark,
        }),
        keepalive: true,
      });
    }
  }, []);

  return (
    <Section
      ref={ref}
      sectionId="community"
      bg="midnight"
      data-testid="community-section"
      className="relative overflow-hidden isolate w-full max-w-full"
    >
      {/* Ambient glows — contidos e escalados por breakpoint */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 right-0
            w-[16rem] h-[16rem] blur-[55px]
            sm:w-[26rem] sm:h-[26rem] sm:blur-[120px]
            lg:w-[45rem] lg:h-[45rem] lg:blur-[220px]
            bg-gold-prestige/[0.035] rounded-full"
        />
        <div
          className="hidden sm:block absolute bottom-0 left-0
            sm:w-[20rem] sm:h-[20rem] sm:blur-[100px]
            lg:w-[35rem] lg:h-[35rem] lg:blur-[180px]
            bg-white/[0.012] rounded-full"
        />
      </div>

      <Container className="relative z-10">
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* LEFT — editorial content */}
          <motion.div
            initial={reducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-gold-prestige font-semibold mb-5">
              FAÇA PARTE DA FLYCREW
            </p>

            <h2 className="font-cinzel font-light text-white text-4xl sm:text-5xl lg:text-7xl leading-[0.95] tracking-tight mb-6">
              Sua Jornada
              <br />
              Na Aviação
              <br />
              <span className="text-gold-prestige">Começa Aqui.</span>
            </h2>

            <div className="w-12 h-px bg-gradient-to-r from-transparent via-gold-prestige to-transparent mb-8" />

            <p className="font-montserrat font-light text-silver-mist/80 text-sm sm:text-base leading-relaxed max-w-xs mb-8">
              Entre para uma comunidade exclusiva de futuros comissários e profissionais da aviação
              que compartilham o mesmo objetivo: conquistar espaço no mercado com preparação de alto
              nível, confiança e excelência profissional.
            </p>

            <ul className="space-y-3">
              {bullets.map((b, i) => (
                <motion.li
                  key={i}
                  initial={reducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{
                    duration: 0.5,
                    delay: 0.3 + i * 0.08,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex items-center gap-3 text-silver-mist/60 text-xs tracking-[0.12em] uppercase font-montserrat"
                >
                  <span className="text-gold-prestige/60 text-[0.6rem]">✦</span>
                  {b}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Vertical separator — lg only, agora ancorado corretamente no grid */}
          <div className="hidden lg:block absolute left-1/2 top-[10%] h-[80%] w-px bg-gradient-to-b from-transparent via-white/8 to-transparent pointer-events-none" />

          {/* RIGHT — form */}
          <motion.div
            initial={reducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: 16 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col justify-center"
          >
            <p className="text-[0.65rem] uppercase tracking-[0.15em] text-white/30 font-montserrat mb-6">
              Uma vaga. Uma decisão.
            </p>
            <NewsletterForm />
          </motion.div>
        </div>
      </Container>
    </Section>
  );
}
