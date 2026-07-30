'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useInViewSafe } from '@/hooks/use-in-view-safe';
import { EASE_CINEMATIC } from '@/lib/motion';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';

/* ───── Steps ───── */
const steps = [
  {
    before: 'Dúvida sobre seu potencial',
    after: 'Presença profissional marcante',
  },
  {
    before: 'Nervosismo em entrevistas',
    after: 'Comunicação elegante e segura',
  },
  {
    before: 'Insegurança sobre o padrão',
    after: 'Mentalidade alinhada ao mercado',
  },
  {
    before: 'Sensação de não estar pronta',
    after: 'Confiança para voar sua carreira',
  },
];

/* ───── Variants ───── */
const sideReveal = (direction: 'left' | 'right') => ({
  hidden: {
    opacity: 0,
    x: direction === 'left' ? -30 : 30,
  },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.9, delay: 0.1 + i * 0.12, ease: EASE_CINEMATIC },
  }),
});

const sideRevealInstant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

const lineReveal = {
  hidden: { scaleY: 0 },
  visible: { scaleY: 1, transition: { duration: 1.2, ease: EASE_CINEMATIC } },
};

function StepRow({
  step,
  index,
  reducedMotion,
}: {
  step: (typeof steps)[0];
  index: number;
  reducedMotion: boolean;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const inView = useInViewSafe(rowRef, { once: true, margin: '-60px' });

  const leftVariant = reducedMotion ? sideRevealInstant : sideReveal('left');
  const rightVariant = reducedMotion ? sideRevealInstant : sideReveal('right');

  return (
    <div
      ref={rowRef}
      className="relative grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 py-5 sm:py-6 lg:py-7"
    >
      {/* Connecting hairline between before/after (visible on lg+) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:block w-8 h-px bg-gold-prestige/20" />

      {/* Before */}
      <motion.p
        custom={index}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        variants={leftVariant}
        className="text-sm sm:text-base lg:text-lg leading-relaxed text-white/40 font-montserrat font-light tracking-wide text-left lg:pr-8"
      >
        <span className="text-[0.625rem] tracking-[0.25em] text-white/15 uppercase font-medium mr-3 font-montserrat">
          {String(index + 1).padStart(2, '0')}
        </span>
        {step.before}
      </motion.p>

      {/* After */}
      <motion.p
        custom={index}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        variants={rightVariant}
        className="text-sm sm:text-base lg:text-lg leading-relaxed text-cloud-white font-montserrat font-light tracking-wide text-left lg:pl-8"
      >
        <span className="text-gold-prestige mr-3 font-montserrat text-xs">✦</span>
        {step.after}
      </motion.p>
    </div>
  );
}

export default function TransformationSection() {
  // Diagnóstico de hidratação (temporário) — marca a PRIMEIRA renderização
  // do cliente. Guardado por ref para disparar uma única vez, nunca em
  // re-renders subsequentes. Fora de qualquer useEffect, conforme a
  // instrumentação solicitada. Nome 'transformation-render-start' (único
  // — não reutiliza 'hero-', 'nav-', 'testimonials-', 'founders-',
  // 'workshops-' nem 'newsletter-form-render-start', que já existem na
  // mesma página /; cada componente precisa de nome único na timeline
  // do performance para o getEntriesByName não-ambíguo).
  const transformationRenderMarkedRef = useRef(false);
  if (!transformationRenderMarkedRef.current) {
    transformationRenderMarkedRef.current = true;
    if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
      performance.mark('transformation-render-start');
    }
  }

  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const headerInView = useInViewSafe(headerRef, { once: true, margin: '-60px' });
  const dividerInView = useInViewSafe(dividerRef, { once: true, margin: '-100px' });

  // Diagnóstico de hidratação (temporário) — sinaliza que o mount efetivamente
  // terminou (passive effects rodaram). O delta real (mark → mount effects)
  // é calculado AQUI no cliente usando a mark 'transformation-render-start'
  // criada no topo do componente, e enviado como msSinceMark — o servidor só
  // o exibe. (performance.now() é relativo à navegação da página; subtrair de
  // Date.now() epoch não representaria tempo real nenhum.) TransformationSection
  // não tinha useEffect de mount pré-existente, então este foi criado novo.
  useEffect(() => {
    const markName = 'transformation-render-start';
    const markEntry =
      typeof performance !== 'undefined' ? performance.getEntriesByName(markName)[0] : undefined;
    const msSinceMark = markEntry
      ? Math.round(performance.now() - markEntry.startTime)
      : null;

    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(
        '/api/debug-log',
        JSON.stringify({
          tag: 'TransformationSection',
          msg: 'mount effects complete',
          msSinceMark,
        }),
      );
    } else {
      fetch('/api/debug-log', {
        method: 'POST',
        body: JSON.stringify({
          tag: 'TransformationSection',
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
      bg="midnight"
      data-testid="transformation-section"
      className="overflow-hidden"
    >
      {/* Ambient glow — desktop only, via CSS breakpoint (nunca monta no mobile,
          nem antes da hidratação). Custo de blur pesado eliminado no celular. */}
      <div className="hidden md:block absolute top-1/4 left-[10%] w-[30rem] h-[30rem] bg-white/[0.02] rounded-full blur-[150px] pointer-events-none" />
      <div className="hidden md:block absolute bottom-1/3 right-[5%] w-[35rem] h-[35rem] bg-gold-prestige/[0.04] rounded-full blur-[180px] pointer-events-none" />

      <Container className="relative z-10">
        {/* ─── Header ─── */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0 }}
          animate={headerInView ? { opacity: 1 } : {}}
          transition={{ duration: reducedMotion ? 0.2 : 0.6 }}
          className="mb-16 sm:mb-20 lg:mb-24"
        >
          <span className="section-label">02 — TRANSFORMAÇÃO</span>
          <h2 className="mt-6 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-cinzel font-light tracking-tight text-white leading-[1.08] max-w-4xl">
            De Onde Você Sai
            <br />
            <span className="text-gold-prestige">Para Onde Vai</span>
          </h2>
        </motion.div>

        {/* ─── Split layout ───
            Two columns: Before (moody) | After (luminous)
            Center divider runs the full height as an editorial spine.
        */}
        <div className="relative">
          {/* Column labels — visible on lg+ */}
          <div className="hidden lg:grid lg:grid-cols-2 mb-8">
            <p className="text-[0.625rem] tracking-[0.35em] text-white/20 uppercase font-montserrat font-medium">
              Antes
            </p>
            <p className="text-[0.625rem] tracking-[0.35em] text-gold-prestige/60 uppercase font-montserrat font-medium text-right">
              Depois
            </p>
          </div>

          {/* Steps */}
          <div className="relative">
            {steps.map((step, i) => (
              <StepRow key={i} step={step} index={i} reducedMotion={!!reducedMotion} />
            ))}
          </div>

          {/* Center editorial divider spine */}
          <motion.div
            ref={dividerRef}
            initial="hidden"
            animate={dividerInView ? 'visible' : 'hidden'}
            variants={reducedMotion ? sideRevealInstant : lineReveal}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent origin-top hidden lg:block"
          />
        </div>

        {/* ─── Footer accent ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: reducedMotion ? 0.2 : 0.8, delay: reducedMotion ? 0 : 0.6 }}
          className="mt-16 sm:mt-20 lg:mt-24 pt-8 border-t border-white/[0.04] text-center"
        >
          <p className="text-xs sm:text-sm text-white/30 font-montserrat font-light max-w-xl mx-auto leading-relaxed">
            A diferença entre quem você é hoje e quem você pode se tornar
            <br className="hidden sm:inline" />é a decisão de dar o primeiro passo.
          </p>
        </motion.div>
      </Container>
    </Section>
  );
}
