'use client';

import { useState, useRef, useCallback, useId, useEffect } from 'react';
import { queueDebugLog } from '@/lib/debug-log-batch';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Users, Clock, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import WorkshopBookingForm from '@/components/landing/WorkshopBookingForm';
import { cn } from '@/lib/utils';

interface Workshop {
  id: string;
  title: string;
  duration: string;
  capacity: string;
  description: string;
  imageUrl?: string | null;
  isActive?: boolean;
  displayOrder?: number;
  updatedAt?: string;
  startDate?: string | null;
  endDate?: string | null;
}

interface WorkshopsSectionProps {
  workshops: Workshop[];
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** JSON-LD Event structured data — enables Google event rich results.
 *  Note: Google's Event schema strongly recommends a `location` with a real
 *  address for full rich-result eligibility. The Workshop model has no venue
 *  address field today, so `location` below only carries the org name. Add
 *  an address field to Workshop if you want the complete rich snippet. */
function WorkshopsStructuredData({ workshops }: { workshops: Workshop[] }) {
  const events = workshops
    .filter((w) => w.startDate)
    .map((w) => {
      const capacityMatch = w.capacity?.match(/\d+/);
      return {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: w.title,
        description: w.description,
        startDate: w.startDate,
        endDate: w.endDate || w.startDate,
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        eventStatus: 'https://schema.org/EventScheduled',
        ...(w.imageUrl ? { image: [w.imageUrl] } : {}),
        ...(capacityMatch ? { maximumAttendeeCapacity: Number(capacityMatch[0]) } : {}),
        location: {
          '@type': 'Place',
          name: 'Fly Crew Experience',
        },
        organizer: {
          '@type': 'Organization',
          name: 'Fly Crew Experience',
        },
      };
    });

  if (events.length === 0) return null;

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(events) }}
    />
  );
}

function WorkshopImage({
  imageUrl,
  title,
  updatedAt,
}: {
  imageUrl?: string | null;
  title: string;
  updatedAt?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (!imageUrl || errored) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-executive-black/50">
        <Users size={32} className="text-gold-prestige/50" />
      </div>
    );
  }

  const src = updatedAt ? imageUrl + '?v=' + updatedAt : imageUrl;

  return (
    <Image
      src={src}
      alt={title}
      fill
      sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
      className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
      onError={() => setErrored(true)}
    />
  );
}

interface WorkshopCardProps {
  workshop: Workshop;
}

function WorkshopCard({ workshop }: WorkshopCardProps) {
  const { title, duration, capacity, description, imageUrl, updatedAt, startDate, endDate } =
    workshop;

  return (
    <div className="group relative flex flex-col h-full border border-white/10 rounded-2xl overflow-hidden hover:border-gold-prestige/30 transition-all duration-500 bg-executive-black/30">
      <div className="relative w-full h-[220px] flex-shrink-0 overflow-hidden">
        <WorkshopImage imageUrl={imageUrl} title={title} updatedAt={updatedAt} />
      </div>

      <div className="flex flex-col flex-1 p-6">
        <h3 className="font-cinzel font-light text-white text-xl leading-snug mb-2 line-clamp-2">
          {title}
        </h3>
        <p className="font-montserrat font-light text-silver-mist/80 text-sm leading-relaxed mb-4 flex-1 line-clamp-4">
          {description}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gold-prestige/70 mt-auto pt-4 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <Clock size={13} aria-hidden="true" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={13} aria-hidden="true" />
            <span>{capacity}</span>
          </div>
          {startDate && (
            <div className="flex items-center gap-1.5">
              <Calendar size={13} aria-hidden="true" />
              {endDate ? (
                <span>
                  <time dateTime={startDate}>{formatDate(startDate)}</time>
                  {' \u2192 '}
                  <time dateTime={endDate}>{formatDate(endDate)}</time>
                </span>
              ) : (
                <time dateTime={startDate}>{formatDate(startDate)}</time>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold-prestige scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
    </div>
  );
}

const SLIDE_VARIANTS = {
  enter: (direction: number) => ({ x: direction > 0 ? 32 : -32, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -32 : 32, opacity: 0 }),
};

const SWIPE_THRESHOLD = 50;

function WorkshopCarousel({
  workshops,
  reducedMotion,
}: {
  workshops: Workshop[];
  reducedMotion: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const liveRegionId = useId();
  const hasMultiple = workshops.length > 1;

  const paginate = useCallback(
    (dir: number) => {
      setDirection(dir);
      setCurrent((prev) => (prev + dir + workshops.length) % workshops.length);
    },
    [workshops.length],
  );

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) {
      paginate(1);
    } else if (info.offset.x > SWIPE_THRESHOLD) {
      paginate(-1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!hasMultiple) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      paginate(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      paginate(-1);
    }
  };

  return (
    <div
      className="relative outline-none"
      role={hasMultiple ? 'region' : undefined}
      aria-roledescription={hasMultiple ? 'carousel' : undefined}
      aria-label={hasMultiple ? 'Workshops disponíveis' : undefined}
      tabIndex={hasMultiple ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      {hasMultiple && (
        <p id={liveRegionId} className="sr-only" aria-live="polite">
          {`Workshop ${current + 1} de ${workshops.length}: ${workshops[current].title}`}
        </p>
      )}

      {/* Dots + counter — only meaningful with more than one workshop */}
      {hasMultiple && (
        <div className="flex items-center justify-between mb-5 px-1">
          <div className="flex items-center gap-2 sm:gap-2.5">
            {workshops.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setDirection(i > current ? 1 : -1);
                  setCurrent(i);
                }}
                aria-label={`Ir para workshop ${i + 1}`}
                aria-current={i === current}
                className="relative flex items-center justify-center w-5 h-5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-prestige rounded-full"
              >
                <span
                  className={cn(
                    'rounded-full transition-all duration-300',
                    i === current ? 'w-2.5 h-2.5 bg-gold-prestige' : 'w-1.5 h-1.5 bg-white/25',
                  )}
                />
              </button>
            ))}
          </div>
          <span className="text-[0.625rem] tracking-[0.3em] text-white/20 uppercase font-montserrat tabular-nums">
            {String(current + 1).padStart(2, '0')} / {String(workshops.length).padStart(2, '0')}
          </span>
        </div>
      )}

      {/* Card */}
      <div className="overflow-hidden touch-pan-y">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={reducedMotion ? {} : SLIDE_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            drag={hasMultiple ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
          >
            <WorkshopCard workshop={workshops[current]} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Arrows */}
      {hasMultiple && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => paginate(-1)}
            aria-label="Workshop anterior"
            className="border border-white/15 rounded-full p-3 text-white/40 hover:border-gold-prestige/40 hover:text-gold-prestige active:scale-95 transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-prestige"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => paginate(1)}
            aria-label="Próximo workshop"
            className="border border-white/15 rounded-full p-3 text-white/40 hover:border-gold-prestige/40 hover:text-gold-prestige active:scale-95 transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-prestige"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function WorkshopsSection({ workshops }: WorkshopsSectionProps) {
  // Diagnóstico de hidratação (temporário) — marca a PRIMEIRA renderização
  // do cliente. Guardado por ref para disparar uma única vez, nunca em
  // re-renders subsequentes. Fora de qualquer useEffect, conforme a
  // instrumentação solicitada. Nome 'workshops-render-start' (único — não
  // reutiliza 'hero-', 'nav-', 'testimonials-' ou 'founders-render-start',
  // que já existem na mesma página /; cada componente precisa de nome
  // único na timeline do performance para o getEntriesByName não-ambíguo).
  const workshopsRenderMarkedRef = useRef(false);
  if (!workshopsRenderMarkedRef.current) {
    workshopsRenderMarkedRef.current = true;
    if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
      performance.mark('workshops-render-start');
    }
  }

  const sectionRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  // Diagnóstico de hidratação (temporário) — sinaliza que o mount efetivamente
  // terminou (passive effects rodaram). O delta real (mark → mount effects)
  // é calculado AQUI no cliente usando a mark 'workshops-render-start' criada
  // no topo do componente, e enviado como msSinceMark — o servidor só o exibe.
  // (performance.now() é relativo à navegação da página; subtrair de Date.now()
  // epoch não representaria tempo real nenhum.) WorkshopsSection não tinha
  // useEffect de mount pré-existente, então este foi criado novo.
  useEffect(() => {
    const markName = 'workshops-render-start';
    const markEntry =
      typeof performance !== 'undefined' ? performance.getEntriesByName(markName)[0] : undefined;
    const msSinceMark = markEntry
      ? Math.round(performance.now() - markEntry.startTime)
      : null;

    queueDebugLog({
      tag: 'WorkshopsSection',
      msg: 'mount effects complete',
      msSinceMark,
    });
  }, []);

  return (
    <Section ref={sectionRef} sectionId="workshops" bg="black" data-testid="workshops-section">
      <WorkshopsStructuredData workshops={workshops} />
      <Container className="relative z-10">
        {/* Header */}
        <ScrollReveal className="text-center mb-16 lg:mb-20">
          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-gold-prestige font-semibold mb-6">
            EXPERIENCIAS EXCLUSIVAS
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-cinzel font-light tracking-tight text-white leading-[1.1] max-w-3xl mx-auto">
            Transformacao atraves da Experiencia
          </h2>
          <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-gold-prestige to-transparent mx-auto mt-6" />
        </ScrollReveal>

        {/* Workshops Display */}
        <div className="mb-16">
          {workshops.length === 0 ? (
            <p className="text-silver-mist/60 font-montserrat text-center py-16">
              Nenhum workshop disponivel no momento.
            </p>
          ) : (
            <>
              {/* MOBILE / TABLET ESTREITO (abaixo de md): sempre carrossel */}
              <div className="md:hidden max-w-md mx-auto">
                <WorkshopCarousel workshops={workshops} reducedMotion={!!reducedMotion} />
              </div>

              {/* DESKTOP (md+): grid que se adapta à quantidade de workshops.
                  1 → card único centralizado; 2 → duas colunas centralizadas
                  com a mesma largura de card do cenário de 3; 3 → grid cheio. */}
              <div
                className={cn(
                  'hidden md:grid gap-6',
                  workshops.length === 1 && 'max-w-md mx-auto',
                  workshops.length === 2 && 'md:grid-cols-2 max-w-3xl mx-auto',
                  workshops.length >= 3 && 'md:grid-cols-2 lg:grid-cols-3',
                )}
              >
                {workshops.map((w) => (
                  <WorkshopCard key={w.id} workshop={w} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Editorial separator */}
        <div className="flex items-center gap-4 my-20">
          <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-gold-prestige/40" />
          <span className="text-gold-prestige/60 text-xs">&#10022;</span>
          <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-gold-prestige/40" />
        </div>

        {/* Booking Form */}
        <ScrollReveal>
          <div className="max-w-2xl mx-auto">
            <WorkshopBookingForm workshops={workshops} />
          </div>
        </ScrollReveal>
      </Container>
    </Section>
  );
}
