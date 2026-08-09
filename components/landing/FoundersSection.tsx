'use client';

import { useRef, useState, useEffect } from 'react';
import { queueDebugLog } from '@/lib/debug-log-batch';
import { motion } from 'framer-motion';
import { useInViewSafe } from '@/hooks/use-in-view-safe';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useIsMobile } from '@/hooks/use-mobile';
import Image from 'next/image';

const founders = [
  {
    name: 'Nathalie',
    role: 'Fundadora',
    image: '/images/founders/nathalie.jpeg',
    bio: 'Nathali traz experiência internacional em aviação e paixão por criar experiências educacionais transformadoras. Sua abordagem combina inteligência emocional com excelência prática, criando impacto profissional duradouro.',
  },
  {
    name: 'Thaís',
    role: 'Co-Fundadora',
    image: '/images/founders/thais.jpeg',
    bio: 'Com mais de 10 anos em aviação premium, Thaís transformou centenas de aspirantes em profissionais confiantes da elite aérea. Sua expertise em psicologia de entrevistas e presença profissional se tornou o padrão ouro no Brasil.',
  },
];

// Helper to extract pull quote from bio (simplified for demo)
const getPullQuote = (bio: string): string => {
  if (bio.includes('inteligência emocional'))
    return '"Inteligência emocional com excelência prática"';
  if (bio.includes('psicologia de entrevistas'))
    return '"Psicologia de entrevistas e presença profissional"';
  return '"Experiência e dedicação"';
};

// Interpolação linear-piecewise com clamp nas bordas — réplica EXATA do
// comportamento default (clamp: true) do useTransform do Framer Motion: para
// progress <= input[0]fixa em output[0], progress >= input[last] fixa em
// output[last]; entre stops, interpolação linear. Usada pelo rAF do wrapper
// para reproduzir os 2 transforms originais SEM useTransform (sem subscrição
// de MotionValue competindo por thread principal durante a hidratação).
function interpolateClamp(progress: number, input: number[], output: number[]): number {
  const n = input.length;
  if (progress <= input[0]) return output[0];
  if (progress >= input[n - 1]) return output[n - 1];
  for (let i = 0; i < n - 1; i++) {
    if (progress >= input[i] && progress <= input[i + 1]) {
      const t = (progress - input[i]) / (input[i + 1] - input[i]);
      return output[i] + t * (output[i + 1] - output[i]);
    }
  }
  return output[n - 1];
}

export default function FoundersSection() {
  // Diagnóstico de hidratação (temporário) — marca a PRIMEIRA renderização
  // do cliente. Guardado por ref para disparar uma única vez, nunca em
  // re-renders subsequentes. Fora de qualquer useEffect, conforme a
  // instrumentação solicitada. Nome 'founders-render-start' (único — não
  // reutiliza 'hero-', 'nav-' ou 'testimonials-render-start', que já existem
  // na mesma página /; cada componente precisa de nome único na timeline
  // do performance para o getEntriesByName não-ambíguo).
  const foundersRenderMarkedRef = useRef(false);
  if (!foundersRenderMarkedRef.current) {
    foundersRenderMarkedRef.current = true;
    if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
      performance.mark('founders-render-start');
    }
  }

  const ref = useRef<HTMLElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const isInView = useInViewSafe(ref, { once: true, margin: '-150px' });
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  // Diagnóstico de hidratação (temporário) — sinaliza que o mount efetivamente
  // terminou (passive effects rodaram). O delta real (mark → mount effects)
  // é calculado AQUI no cliente usando a mark 'founders-render-start' criada
  // no topo do componente, e enviado como msSinceMark — o servidor só o exibe.
  // (performance.now() é relativo à navegação da página; subtrair de Date.now()
  // epoch não representaria tempo real nenhum.) FoundersSection não tinha
  // useEffect de mount pré-existente, então este foi criado novo.
  useEffect(() => {
    const markName = 'founders-render-start';
    const markEntry =
      typeof performance !== 'undefined' ? performance.getEntriesByName(markName)[0] : undefined;
    const msSinceMark = markEntry
      ? Math.round(performance.now() - markEntry.startTime)
      : null;

    queueDebugLog({
      tag: 'FoundersSection',
      msg: 'mount effects complete',
      msSinceMark,
    });
  }, []);

  // Parallax scroll-driven do wrapper (opacity + scale) via rAF + escrita
  // direta em style.transform/opacity (fora do ciclo de render do React), no
  // MESMO padrão já validado em FinalCTASection.tsx e Navigation.tsx. Substitui
  // useScroll/useTransform do Framer Motion — 1 listener de scroll + 1 de
  // resize, batch de leitura antes da escrita, cleanup completo. Elimina a
  // subscrição de MotionValue que competia por thread principal durante a
  // hidratação do chunk lazy do Founders (causa do INP ruim no Speed Insights).
  // Fidelidade matemática preservada por interpolateClamp (clamp idêntico ao
  // default do useTransform): opacity = 4 stops [0,0.2,0.8,1]→[0,1,1,0.5],
  // scale = 2 stops [0,0.2]→[0.95,1]. Progress via fórmula do offset
  // 'start end'/'end start' (mesma do FinalCTA). Gate reducedMotion || isMobile
  // → estado neutro fixo (opacity 1, scale 1), sem listeners.
  // Nota: medimos o <section> (ref) — mesmo alvo do useScroll anterior — e não o
  // wrapper, para que o padding py-32 da seção continue na curva de progress.
  // Estado inline inicial do wrapper é o "neutro/na-viewport" (opacity:1,
  // scale:1): se a seção hidrata fora de viewport, o useEffect a corrige para
  // opacity:0 no frame seguinte — fora da tela, sem flash visível. Se hidrata
  // já na viewport, o inline já está correto.
  useEffect(() => {
    const section = ref.current;
    const wrapper = wrapperRef.current;
    if (!section || !wrapper) return;

    if (reducedMotion || isMobile) {
      wrapper.style.opacity = '1';
      wrapper.style.transform = 'scale(1)';
      return;
    }

    const updateContent = () => {
      rafRef.current = null; // self-clear do handle (gate p/ próximo schedule)
      // Batch de leitura ANTES da escrita (mesma disciplina do FinalCTA):
      const rect = section.getBoundingClientRect();
      // Fórmula do offset 'start end'/'end start':
      // progress=0 quando rect.top>=innerHeight (alvo ainda abaixo da viewport),
      // progress=1 quando rect.top<=-rect.height (alvo já saiu por cima).
      const progress = Math.min(
        1,
        Math.max(0, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)),
      );
      // Réplica fiel dos 2 useTransform originais (clamp nas bordas):
      const op = interpolateClamp(progress, [0, 0.2, 0.8, 1], [0, 1, 1, 0.5]);
      const sc = interpolateClamp(progress, [0, 0.2], [0.95, 1]);
      // Escrita única, GPU-only (transform) + opacity, fora do render do React:
      wrapper.style.opacity = String(op);
      wrapper.style.transform = `scale(${sc})`;
    };

    const scheduleContent = () => {
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(updateContent);
      }
    };

    // Estado inicial (seção pode montar já parcialmente em viewport):
    updateContent();
    window.addEventListener('scroll', scheduleContent, { passive: true });
    window.addEventListener('resize', scheduleContent, { passive: true });
    return () => {
      window.removeEventListener('scroll', scheduleContent);
      window.removeEventListener('resize', scheduleContent);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [reducedMotion, isMobile]);

  return (
    <section
      id="founders"
      ref={ref}
      className="py-32 sm:py-40 lg:py-48 bg-executive-black relative overflow-hidden"
      data-testid="founders-section"
    >
      {/* Ambient Background Elements */}
      <div className="absolute top-1/4 right-0 w-[30rem] h-[30rem] bg-gold-prestige/3 rounded-full blur-[120px] animation-glow" />
      <div className="absolute bottom-1/3 left-0 w-[25rem] h-[25rem] bg-gold-prestige/5 rounded-full blur-[100px]" />

      <div
        ref={wrapperRef}
        className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10"
        // Estado neutro inicial ("na viewport"): opacity 1, scale 1. O useEffect
        // rAF corrige (opacity/scale) assim que monta. Se a seção está ABAIXO da
        // viewport no mount (caso comum — Founders é seção do meio), a escrita
        // para opacity:0 acontece FORA da tela → sem flash visível. Se hidrata
        // já dentro da viewport, este inline já está correto. Gate
        // reducedMotion||isMobile → useEffect retorna cedo e mantém este neutro.
        style={{ opacity: 1, transform: 'scale(1)' }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-24 lg:mb-32 space-y-8"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-gold-prestige font-semibold mb-6">
              QUEM SOMOS
            </p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-cinzel font-light tracking-tight text-white leading-[1.1] max-w-4xl mx-auto">
              Conheça nossas
              <br />
              <span className="text-gold-prestige">Fundadoras</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-24 h-[1px] bg-gradient-to-r from-transparent via-gold-prestige to-transparent mx-auto"
          />
        </motion.div>

        {/* Founders Grid with varied spacing */}
        <div className="space-y-[60px] lg:space-y-[80px]">
          {founders.map((founder, idx) => (
            <FounderCard
              key={founder.name}
              founder={founder}
              index={idx}
              isInView={isInView}
              reducedMotion={reducedMotion}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FounderCard({
  founder,
  index,
  isInView,
  reducedMotion,
}: {
  founder: {
    name: string;
    role: string;
    bio: string;
    image: string;
  };
  index: number;
  isInView: boolean;
  reducedMotion: boolean;
}) {
  const isReversed = index % 2 === 1;
  const cardRef = useRef(null);

  // Motion variants with reduced motion support
  const containerVariants = {
    hidden: { opacity: 0, y: 80 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 1.2,
        delay: index * 0.3,
        ease: [0.16, 1, 0.3, 1],
        ...(reducedMotion && { duration: 0, delay: 0 }), // Instant if reduced motion
      },
    },
  };

  const nameVariants = {
    hidden: { opacity: 0, y: 30, letterSpacing: '-0.05em' },
    visible: {
      opacity: 1,
      y: 0,
      letterSpacing: '0em',
      transition: {
        duration: 0.8,
        delay: index * 0.3 + 0.4,
        ease: [0.16, 1, 0.3, 1],
        ...(reducedMotion && { duration: 0, delay: 0 }),
      },
    },
  };

  const roleLineVariants = {
    hidden: { opacity: 0, scaleX: 0 },
    visible: {
      opacity: 1,
      scaleX: 1,
      transition: {
        duration: 0.6,
        delay: index * 0.3 + 0.5,
        ease: [0.16, 1, 0.3, 1],
        ...(reducedMotion && { duration: 0, delay: 0 }),
      },
    },
  };

  const roleTextVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        delay: index * 0.3 + 0.6,
        ease: [0.16, 1, 0.3, 1],
        ...(reducedMotion && { duration: 0, delay: 0 }),
      },
    },
  };

  const pullQuoteVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        delay: index * 0.3 + 0.7,
        ease: [0.16, 1, 0.3, 1],
        ...(reducedMotion && { duration: 0, delay: 0 }),
      },
    },
  };

  const bioVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        delay: index * 0.3 + 0.8,
        ease: [0.16, 1, 0.3, 1],
        ...(reducedMotion && { duration: 0, delay: 0 }),
      },
    },
  };

  const quoteMarkVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: 0.1,
      scale: 1,
      transition: {
        duration: 0.6,
        delay: index * 0.3 + 0.9,
        ease: [0.16, 1, 0.3, 1],
        ...(reducedMotion && { duration: 0, delay: 0 }),
      },
    },
  };

  const pullQuoteText = getPullQuote(founder.bio);

  return (
    <motion.div
      ref={cardRef}
      initial={containerVariants.hidden}
      animate={isInView ? containerVariants.visible : undefined}
      className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center"
    >
      {/* Image */}
      <motion.div
        className={`lg:col-span-7 ${isReversed ? 'lg:order-2' : ''} relative transition-transform duration-500 [@media(hover:hover)]:hover:scale-[1.02]`}
        tabIndex={0}
      >
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl group">
          <div className="absolute inset-0">
            <Image
              src={founder.image}
              alt={founder.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
              priority={index === 0}
            />
          </div>

          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-executive-black via-executive-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-gold-prestige/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          {/* Subtle Border Glow */}
          <div className="absolute inset-0 rounded-2xl border border-white/10 group-hover:border-gold-prestige/30 transition-colors duration-700" />

          {/* Gold tint overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-prestige/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        className={`lg:col-span-5 space-y-8 ${isReversed ? 'lg:order-1' : ''} relative`}
        initial={{ opacity: 0, x: isReversed ? 60 : -60 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{
          duration: 1,
          delay: index * 0.3 + 0.3,
          ease: [0.16, 1, 0.3, 1],
          ...(reducedMotion && { duration: 0, delay: 0 }),
        }}
      >
        {/* Name & Role */}
        <div className="space-y-4">
          <motion.h3
            initial={nameVariants.hidden}
            animate={isInView ? nameVariants.visible : undefined}
            className="text-5xl sm:text-6xl lg:text-7xl font-cinzel font-light text-white leading-[0.9] tracking-tight"
          >
            {founder.name}
          </motion.h3>

          <motion.div
            initial={roleLineVariants.hidden}
            animate={isInView ? roleLineVariants.visible : undefined}
            className="w-16 h-[2px] bg-gold-prestige origin-left"
          />

          <motion.p
            initial={roleTextVariants.hidden}
            animate={isInView ? roleTextVariants.visible : undefined}
            className="text-sm uppercase tracking-[0.25em] text-gold-prestige font-semibold"
          >
            {founder.role}
          </motion.p>
        </div>

        {/* Pull Quote */}
        <motion.p
          initial={pullQuoteVariants.hidden}
          animate={isInView ? pullQuoteVariants.visible : undefined}
          className="text-base italic text-silver-mist/80 font-cinzel font-light leading-relaxed mb-4 max-w-[300px]"
        >
          {pullQuoteText}
        </motion.p>

        {/* Bio */}
        <motion.p
          initial={bioVariants.hidden}
          animate={isInView ? bioVariants.visible : undefined}
          className="text-lg sm:text-xl text-silver-mist leading-relaxed font-montserrat font-light"
        >
          {founder.bio}
        </motion.p>

        {/* Decorative Quote Mark - refined position and size */}
        <motion.div
          initial={quoteMarkVariants.hidden}
          animate={isInView ? quoteMarkVariants.visible : undefined}
          className="text-[60px] font-cinzel text-gold-prestige/10 leading-none absolute -top-2 -left-2"
        >
          "
        </motion.div>

        {/* Decorative numeral */}
        <div className="text-[100px] font-cinzel font-light text-white/5 absolute -top-4 left-[-20px] -z-10">
          {index + 1}
        </div>
      </motion.div>
    </motion.div>
  );
}