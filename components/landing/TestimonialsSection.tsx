'use client';

import { useEffect, useState, useCallback, useRef, useId } from 'react';
import { motion, AnimatePresence, PanInfo, Variants } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import Image from 'next/image';

interface Testimonial {
  id: string;
  name: string;
  instagram: string;
  testimonial: string;
  imageUrl?: string | null;
  rating?: number;
  displayOrder?: number;
}

const AUTOPLAY_MS = 6500;
const SWIPE_THRESHOLD = 50;

function Avatar({
  imageUrl,
  name,
  initials,
}: {
  imageUrl?: string | null;
  name: string;
  initials: string;
}) {
  const [errored, setErrored] = useState(false);

  if (!imageUrl || errored) {
    return (
      <div className="w-9 h-9 rounded-full bg-gold-prestige/10 border border-gold-prestige/30 flex items-center justify-center text-gold-prestige font-cinzel text-xs flex-shrink-0">
        {initials}
      </div>
    );
  }

  return (
    <div className="relative w-9 h-9 rounded-full overflow-hidden border border-gold-prestige/20 flex-shrink-0">
      <Image
        src={imageUrl}
        alt={name}
        fill
        sizes="36px"
        className="object-cover"
        onError={() => setErrored(true)}
      />
    </div>
  );
}

function TestimonialCard({
  testimonial,
  variant = 'grid',
}: {
  testimonial: Testimonial;
  variant?: 'carousel' | 'grid';
}) {
  const { name, instagram, testimonial: text, rating, imageUrl } = testimonial;
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const starCount = Math.min(Math.max(rating ?? 5, 0), 5);
  const instagramHandle = instagram.replace('@', '');
  const instagramHref = 'https://instagram.com/' + instagramHandle;
  const instagramLabel = instagram.startsWith('@') ? instagram : '@' + instagram;

  return (
    <div
      className={
        'flex flex-col h-full rounded-lg border-t-2 md:border-t-0 md:border-l-2 border-gold-prestige/40 bg-white/[0.03] transition-shadow duration-300 hover:shadow-[0_4px_12px_rgba(212,175,55,0.15)] theme-transition ' +
        (variant === 'carousel' ? 'p-6 sm:p-8' : 'p-6 sm:p-7')
      }
    >
      {/* Header: quote mark + rating share one row so they can never overlap */}
      <div className="flex items-start justify-between gap-4">
        <Quote
          size={variant === 'carousel' ? 26 : 22}
          className="text-gold-prestige/25 flex-shrink-0"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <div className="flex gap-0.5 pt-1" aria-label={`${starCount} de 5 estrelas`}>
          {Array.from({ length: starCount }).map((_, i) => (
            <Star
              key={i}
              size={13}
              className="fill-gold-prestige text-gold-prestige"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      <p
        className={
          'mt-5 font-cinzel font-light text-white/90 leading-relaxed ' +
          (variant === 'carousel' ? 'text-xl sm:text-2xl' : 'text-lg')
        }
      >
        {text}
      </p>

      <div className="w-full h-px bg-white/5 my-5 mt-auto" />

      <div className="flex items-center gap-3">
        <Avatar imageUrl={imageUrl} name={name} initials={initials} />
        <div>
          <p className="font-cinzel font-light text-white text-sm leading-tight">{name}</p>
          <a
            href={instagramHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-prestige/70 text-xs tracking-wider hover:text-gold-prestige transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-prestige rounded-sm"
          >
            {instagramLabel}
          </a>
        </div>
      </div>
    </div>
  );
}

const SLIDE_VARIANTS: Variants = {
  enter: (direction: number) => ({ x: direction > 0 ? 32 : -32, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -32 : 32, opacity: 0 }),
};

function Carousel({
  testimonials,
  reducedMotion,
}: {
  testimonials: Testimonial[];
  reducedMotion: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [autoplayKey, setAutoplayKey] = useState(0);
  const liveRegionId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback((index: number, dir: number) => {
    setDirection(dir);
    setCurrent(index);
    setAutoplayKey((k) => k + 1); // restart the autoplay timer on any navigation
  }, []);

  const paginate = useCallback(
    (dir: number) => {
      setDirection(dir);
      setCurrent((prev) => (prev + dir + testimonials.length) % testimonials.length);
      setAutoplayKey((k) => k + 1);
    },
    [testimonials.length],
  );

  useEffect(() => {
    if (isPaused || reducedMotion || testimonials.length <= 1) return;
    const timer = setTimeout(() => paginate(1), AUTOPLAY_MS);
    return () => clearTimeout(timer);
    // autoplayKey forces a fresh timer whenever the slide changes for any reason
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused, reducedMotion, testimonials.length, autoplayKey]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    setIsPaused(false);
    if (info.offset.x < -SWIPE_THRESHOLD) {
      paginate(1);
    } else if (info.offset.x > SWIPE_THRESHOLD) {
      paginate(-1);
    } else {
      setAutoplayKey((k) => k + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      paginate(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      paginate(-1);
    }
  };

  const active = testimonials[current];

  return (
    <div
      ref={containerRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Depoimentos de alunos"
      className="relative outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {/* Screen-reader-only live announcement */}
      <p id={liveRegionId} className="sr-only" aria-live="polite">
        {`Depoimento ${current + 1} de ${testimonials.length}: ${active.name}`}
      </p>

      <div className="flex items-center justify-between mb-6 sm:mb-8 px-1">
        <div className="flex items-center gap-2 sm:gap-2.5">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > current ? 1 : -1)}
              aria-label={`Ir para depoimento ${i + 1}`}
              aria-current={i === current}
              className="relative flex items-center justify-center w-5 h-5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-prestige rounded-full"
            >
              <span
                className={
                  'rounded-full transition-all duration-300 ' +
                  (i === current ? 'w-2.5 h-2.5 bg-gold-prestige' : 'w-1.5 h-1.5 bg-white/25')
                }
              />
            </button>
          ))}
        </div>
        <span className="text-[0.625rem] tracking-[0.3em] text-white/20 uppercase font-montserrat tabular-nums">
          {String(current + 1).padStart(2, '0')} / {String(testimonials.length).padStart(2, '0')}
        </span>
      </div>

      {/* Grid-stack: every slide shares the same cell so height follows content
          without animating width/height directly (transform/opacity only). */}
      <div className="grid touch-pan-y cursor-grab active:cursor-grabbing">
        <AnimatePresence custom={direction} initial={false}>
          <motion.div
            key={current}
            custom={direction}
            variants={reducedMotion ? {} : SLIDE_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragStart={() => setIsPaused(true)}
            onDragEnd={handleDragEnd}
            className="[grid-area:1/1]"
            role="group"
            aria-roledescription="slide"
            aria-label={`${current + 1} de ${testimonials.length}`}
          >
            <TestimonialCard testimonial={active} variant="carousel" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Autoplay progress indicator — scaleX only, never width, per motion guidelines */}
      {testimonials.length > 1 && (
        <div className="h-px w-full bg-white/5 mt-6 overflow-hidden rounded-full">
          <motion.div
            key={autoplayKey}
            className="h-full w-full bg-gold-prestige/50 origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isPaused || reducedMotion ? 0 : 1 }}
            transition={{
              duration: isPaused || reducedMotion ? 0 : AUTOPLAY_MS / 1000,
              ease: 'linear',
            }}
          />
        </div>
      )}

      <div className="flex items-center justify-center gap-4 mt-8">
        <button
          onClick={() => paginate(-1)}
          aria-label="Depoimento anterior"
          className="border border-white/15 rounded-full p-3 text-white/40 hover:border-gold-prestige/40 hover:text-gold-prestige active:scale-95 transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-prestige"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => paginate(1)}
          aria-label="Próximo depoimento"
          className="border border-white/15 rounded-full p-3 text-white/40 hover:border-gold-prestige/40 hover:text-gold-prestige active:scale-95 transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-prestige"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  // Diagnóstico de hidratação (temporário) — marca a PRIMEIRA renderização
  // do cliente. Guardado por ref para disparar uma única vez, nunca em
  // re-renders subsequentes. Fora de qualquer useEffect, conforme a
  // instrumentação solicitada. Nome 'testimonials-render-start' (único —
  // não reutiliza 'hero-render-start' nem 'nav-render-start', que já
  // existem na mesma página /; cada componente precisa de nome único na
  // timeline do performance para o getEntriesByName nãoambíguo).
  const testimonialsRenderMarkedRef = useRef(false);
  if (!testimonialsRenderMarkedRef.current) {
    testimonialsRenderMarkedRef.current = true;
    if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
      performance.mark('testimonials-render-start');
    }
  }

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    fetch('/api/testimonials')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setTestimonials(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));

    // Diagnóstico de hidratação (temporário) — sinaliza que o mount efetivamente
    // terminou (passive effects rodaram). O delta real (mark → mount effects)
    // é calculado AQUI no cliente usando a mark 'testimonials-render-start'
    // criada no topo do componente, e enviado como msSinceMark — o servidor só
    // o exibe. (performance.now() é relativo à navegação da página; subtrair de
    // Date.now() epoch não representaria tempo real nenhum.)
    const markName = 'testimonials-render-start';
    const markEntry =
      typeof performance !== 'undefined' ? performance.getEntriesByName(markName)[0] : undefined;
    const msSinceMark = markEntry
      ? Math.round(performance.now() - markEntry.startTime)
      : null;

    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(
        '/api/debug-log',
        JSON.stringify({
          tag: 'TestimonialsSection',
          msg: 'mount effects complete',
          msSinceMark,
        }),
      );
    } else {
      fetch('/api/debug-log', {
        method: 'POST',
        body: JSON.stringify({
          tag: 'TestimonialsSection',
          msg: 'mount effects complete',
          msSinceMark,
        }),
        keepalive: true,
      });
    }
  }, []);

  if (loading) {
    return (
      <section className="py-24 sm:py-32 lg:py-40 bg-executive-black">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex justify-center">
          <div className="w-8 h-8 border-2 border-gold-prestige/20 border-t-gold-prestige rounded-full animate-spin" />
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) return null;

  const desktopUsesCarousel = testimonials.length > 3;

  return (
    <section
      id="testimonials"
      className="py-24 sm:py-32 lg:py-40 bg-executive-black relative overflow-hidden"
      data-testid="testimonials-section"
    >
      <div className="hidden md:block absolute left-0 top-1/4 w-[35rem] h-[35rem] bg-gold-prestige/[0.03] rounded-full blur-[160px] pointer-events-none" />
      <div className="hidden md:block absolute right-0 bottom-1/3 w-[28rem] h-[28rem] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16 relative"
        >
          <span className="absolute top-0 right-0 text-[6rem] font-cinzel font-light text-white/[0.04] leading-none select-none pointer-events-none">
            {String(testimonials.length).padStart(2, '0')}
          </span>

          <p className="text-xs uppercase tracking-[0.3em] text-gold-prestige font-semibold mb-4">
            HISTORIAS REAIS
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-cinzel font-light tracking-tight text-white leading-[1.1] max-w-3xl mx-auto">
            Transformacoes Que Comecaram Aqui
          </h2>
          <div className="w-12 h-px bg-gradient-to-r from-transparent via-gold-prestige to-transparent mx-auto mt-6" />
        </motion.div>

        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="md:hidden max-w-md mx-auto">
            <Carousel testimonials={testimonials} reducedMotion={reducedMotion} />
          </div>

          <div className="hidden md:block">
            {desktopUsesCarousel ? (
              <div className="max-w-2xl mx-auto">
                <Carousel testimonials={testimonials} reducedMotion={reducedMotion} />
              </div>
            ) : (
              <div
                className={
                  'grid grid-cols-1 gap-8 items-stretch ' +
                  (testimonials.length === 1
                    ? 'max-w-lg mx-auto'
                    : testimonials.length === 2
                      ? 'md:grid-cols-2 max-w-3xl mx-auto'
                      : 'md:grid-cols-2 xl:grid-cols-3')
                }
              >
                {testimonials.map((t) => (
                  <TestimonialCard key={t.id} testimonial={t} variant="grid" />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
