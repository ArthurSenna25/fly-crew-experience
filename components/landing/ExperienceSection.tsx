'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { EASE_CINEMATIC } from '@/lib/motion';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useInViewSafe } from '@/hooks/use-in-view-safe';

/* ───── Motion variants ───── */
const numeralReveal = {
  hidden: { opacity: 0, x: -40, scale: 0.92 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 1, delay: 0.15 + i * 0.25, ease: EASE_CINEMATIC },
  }),
};

const contentReveal = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, delay: 0.35 + i * 0.25, ease: EASE_CINEMATIC },
  }),
};

const hairlineReveal = {
  hidden: { scaleX: 0 },
  visible: (i: number) => ({
    scaleX: 1,
    transition: { duration: 1, delay: 0.55 + i * 0.25, ease: EASE_CINEMATIC },
  }),
};

// Variants "estáticos" pra quando reducedMotion está ativo
const staticNumeral = {
  hidden: { opacity: 1, x: 0, scale: 1 },
  visible: { opacity: 1, x: 0, scale: 1 },
};
const staticContent = { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } };
const staticHairline = { hidden: { scaleX: 1 }, visible: { scaleX: 1 } };

/* ───── Pillar data ───── */
const pillars = [
  {
    id: '01',
    title: 'Presença Profissional',
    description:
      'Aprenda a transmitir confiança, elegância e autoridade através da sua postura, comunicação e imagem profissional — o padrão exigido pela aviação executiva.',
  },
  {
    id: '02',
    title: 'Performance em Entrevistas',
    description:
      'Transforme nervosismo em segurança com técnicas estratégicas utilizadas nos processos seletivos reais da aviação premium.',
  },
  {
    id: '03',
    title: 'Mentalidade & Disciplina',
    description:
      'Desenvolva o comportamento, a resiliência e o posicionamento esperados dos profissionais que operam nos mais altos padrões do setor aéreo.',
  },
  {
    id: '04',
    title: 'Inteligência Emocional',
    description:
      'Aprenda a lidar com pressão, desafios e ambientes de alta exigência mantendo equilíbrio, clareza e excelência sob qualquer circunstância.',
  },
];

/* ───── Single editorial pillar ───── */
function Pillar({
  pillar,
  index,
  reducedMotion,
}: {
  pillar: (typeof pillars)[0];
  index: number;
  reducedMotion: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInViewSafe(ref, { once: true, margin: '-80px' });

  const isEven = index % 2 === 0;

  return (
    <div ref={ref} className="relative py-12 sm:py-16 lg:py-20">
      <div
        className={cn(
          'flex flex-col gap-6 sm:gap-8 lg:gap-12',
          isEven ? 'lg:flex-row' : 'lg:flex-row-reverse',
        )}
      >
        {/* ── Large editorial numeral ── */}
        <motion.div
          custom={index}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={reducedMotion ? staticNumeral : numeralReveal}
          className={cn('flex-shrink-0', isEven ? 'lg:pr-16' : 'lg:pl-16')}
        >
          <span
            className="
              block
              text-[4.5rem] sm:text-[6rem] md:text-[8rem] lg:text-[10rem] xl:text-[12rem]
              font-cinzel font-light leading-[0.85]
              text-white/5
              select-none
            "
          >
            {pillar.id}
          </span>
        </motion.div>

        {/* ── Content ── */}
        <motion.div
          custom={index}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={reducedMotion ? staticContent : contentReveal}
          className={cn(
            'flex-1 max-w-lg',
            isEven ? 'lg:self-end lg:text-left' : 'lg:self-start lg:text-right',
          )}
        >
          <h3 className="text-xl sm:text-2xl lg:text-4xl font-cinzel font-light text-white tracking-tight leading-tight">
            {pillar.title}
          </h3>

          {/* Hairline divider */}
          <motion.div
            custom={index}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            variants={reducedMotion ? staticHairline : hairlineReveal}
            className={cn(
              'h-px bg-gradient-to-r from-gold-prestige/50 via-gold-prestige/30 to-transparent origin-left my-5 sm:my-6',
              !isEven &&
                'lg:from-transparent lg:via-gold-prestige/30 lg:to-gold-prestige/50 lg:origin-right',
            )}
          />

          <p className="text-sm sm:text-base leading-relaxed text-silver-mist font-montserrat font-light">
            {pillar.description}
          </p>

          {/* Accent dot */}
          <div className="mt-6 flex items-center gap-2">
            <span className="block w-1.5 h-1.5 rounded-full bg-gold-prestige/50" />
            <span className="block w-1.5 h-1.5 rounded-full bg-gold-prestige/20" />
            <span className="block w-1.5 h-1.5 rounded-full bg-gold-prestige/10" />
          </div>
        </motion.div>
      </div>

      {/* Divider between pillars */}
      {index < pillars.length - 1 && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      )}
    </div>
  );
}

/* ───── Section ───── */
export default function ExperienceSection() {
  // Diagnóstico de hidratação (temporário) — marca a PRIMEIRA renderização
  // do cliente. Guardado por ref para disparar uma única vez, nunca em
  // re-renders subsequentes. Fora de qualquer useEffect, conforme a
  // instrumentação solicitada. Nome 'experience-render-start' (único — não
  // reutiliza 'hero-', 'nav-', 'testimonials-', 'founders-', 'workshops-',
  // 'gallery-', 'transformation-', 'manifesto-' nem 'newsletter-form-render-start',
  // que já existem na mesma página /; cada componente precisa de nome único
  // na timeline do performance para o getEntriesByName não-ambíguo).
  const experienceRenderMarkedRef = useRef(false);
  if (!experienceRenderMarkedRef.current) {
    experienceRenderMarkedRef.current = true;
    if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
      performance.mark('experience-render-start');
    }
  }

  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInViewSafe(headerRef, { once: true, margin: '-60px' });
  const reducedMotion = useReducedMotion();

  // Diagnóstico de hidratação (temporário) — sinaliza que o mount efetivamente
  // terminou (passive effects rodaram). O delta real (mark → mount effects)
  // é calculado AQUI no cliente usando a mark 'experience-render-start'
  // criada no topo do componente, e enviado como msSinceMark — o servidor só
  // o exibe. (performance.now() é relativo à navegação da página; subtrair de
  // Date.now() epoch não representaria tempo real nenhum.) ExperienceSection
  // não tinha useEffect de mount pré-existente, então este foi criado novo.
  useEffect(() => {
    const markName = 'experience-render-start';
    const markEntry =
      typeof performance !== 'undefined' ? performance.getEntriesByName(markName)[0] : undefined;
    const msSinceMark = markEntry
      ? Math.round(performance.now() - markEntry.startTime)
      : null;

    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(
        '/api/debug-log',
        JSON.stringify({
          tag: 'ExperienceSection',
          msg: 'mount effects complete',
          msSinceMark,
        }),
      );
    } else {
      fetch('/api/debug-log', {
        method: 'POST',
        body: JSON.stringify({
          tag: 'ExperienceSection',
          msg: 'mount effects complete',
          msSinceMark,
        }),
        keepalive: true,
      });
    }
  }, []);

  return (
    <Section
      sectionId="experience"
      bg="black"
      data-testid="experience-section"
      className="relative overflow-hidden isolate w-full max-w-full"
    >
      {/* Ambient — contido em wrapper próprio com overflow-hidden e escalado por breakpoint */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/3
            w-[14rem] h-[14rem] blur-[50px]
            sm:w-[22rem] sm:h-[22rem] sm:blur-[100px]
            lg:w-[40rem] lg:h-[40rem] lg:blur-[200px]
            bg-gold-prestige/[0.025] rounded-full"
        />
      </div>

      <Container className="relative z-10">
        {/* ─── Header ─── */}
        <motion.div
          ref={headerRef}
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={headerInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 sm:mb-16 lg:mb-20"
        >
          <span className="section-label">01 — PILARES</span>
          <h2 className="mt-6 text-3xl sm:text-4xl lg:text-6xl xl:text-7xl font-cinzel font-light tracking-tight text-white leading-[1.08] max-w-4xl">
            A Base da Sua
            <br />
            <span className="text-gold-prestige">Transformação</span>
          </h2>
        </motion.div>

        {/* ─── Editorial pillars ─── */}
        <div className="divide-y divide-white/[0.04]">
          {pillars.map((pillar, i) => (
            <Pillar key={pillar.id} pillar={pillar} index={i} reducedMotion={reducedMotion} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
