'use client';

import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useInViewSafe } from '@/hooks/use-in-view-safe';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EASE_CINEMATIC } from '@/lib/motion';
import { Container } from '@/components/ui/Container';
import { Section } from '@/components/ui/Section';
import useEmblaCarousel from 'embla-carousel-react';
import type { EmblaCarouselType, EmblaOptionsType } from 'embla-carousel';
import Autoplay from 'embla-carousel-autoplay';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface GalleryItem {
  id: string;
  imageUrl: string;
  caption: string;
}


/* ────────────────────────────────────────────────────────────
   Detecção de viewport desktop via JS (não CSS) — 1024px é o
   mesmo valor do breakpoint `lg:` do Tailwind usado neste arquivo.

   Por que isso existe: antes, mobile e desktop eram só escondidos
   via `lg:hidden` / `hidden lg:block` (CSS). Isso NÃO impede o React
   de montar os dois ao mesmo tempo — só esconde visualmente. Com
   galerias de mais de 3 imagens, isso significava DOIS carrosséis
   Embla vivos simultaneamente (cada um com seu próprio autoplay,
   listener de resize e imagens carregando), um visível e um invisível.
   Isso sobrecarrega memória/GPU no WebKit (iOS), mesmo sem nenhum
   efeito visual — o invisível continua rodando escondido.

   Esta função garante que só a variante realmente visível é montada
   em JS. `mounted` começa false para evitar mismatch de hidratação
   (o servidor não sabe a largura da tela); a seção só decide o que
   montar depois do primeiro paint no cliente — aceitável aqui porque
   a Galeria não é conteúdo acima da dobra (não afeta LCP).
──────────────────────────────────────────────────────────── */
function useIsDesktopViewport() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mq.matches);
    setMounted(true);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return { isDesktop, mounted };
}

/* ────────────────────────────────────────────────────────────
   Variants (emil-design-eng: cubic-bezier(0.16,1,0.3,1), 300-500ms)
 ──────────────────────────────────────────────────────────── */
const revealClip = {
  hidden: { clipPath: 'inset(0 100% 0 0)' },
  visible: (i: number) => ({
    clipPath: 'inset(0 0% 0 0)',
    transition: { duration: 1.1, delay: 0.15 + i * 0.12, ease: EASE_CINEMATIC },
  }),
};

const fadeSlideUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.3 + i * 0.12, ease: EASE_CINEMATIC },
  }),
};

/* ────────────────────────────────────────────────────────────
   Composições editoriais assimétricas — SOMENTE para <= 3 imagens.
   Acima disso o layout vira carrossel (ver GalleryCarousel).
 ──────────────────────────────────────────────────────────── */
function getGridLayout(count: number): string[] {
  if (count === 1) {
    return ['lg:col-span-12 aspect-[16/9] lg:aspect-[21/9] lg:h-[38rem]'];
  }
  if (count === 2) {
    return [
      'lg:col-span-7 aspect-[4/5] lg:aspect-auto lg:h-[34rem]',
      'lg:col-span-5 aspect-[4/5] lg:aspect-auto lg:h-[26rem] lg:mt-16',
    ];
  }
  // count === 3
  return [
    'lg:col-span-7 lg:row-span-2 aspect-[4/5] lg:aspect-auto lg:h-[36rem]',
    'lg:col-span-5 aspect-[4/3] lg:aspect-auto lg:h-[17rem]',
    'lg:col-span-5 aspect-[4/3] lg:aspect-auto lg:h-[17rem]',
  ];
}

/* ────────────────────────────────────────────────────────────
   Card do grid (desktop, <= 3 imagens)
 ──────────────────────────────────────────────────────────── */
function GalleryCard({
  item,
  index,
  className,
  inView,
  reducedMotion,
  priority,
}: {
  item: GalleryItem;
  index: number;
  className: string;
  inView: boolean;
  reducedMotion: boolean;
  priority?: boolean;
}) {
  return (
    <motion.div
      custom={index}
      initial={reducedMotion ? 'visible' : 'hidden'}
      animate={inView ? 'visible' : 'hidden'}
      variants={revealClip}
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-lg',
        'ring-1 ring-white/[0.06] transition-shadow duration-200 ease-out',
        'hover:ring-gold-prestige/30 hover:shadow-[0_4px_24px_rgba(212,175,55,0.15)]',
        className,
      )}
    >
      <div className="absolute inset-0 z-10 bg-white/[0.02] transition-colors duration-700 group-hover:bg-white/[0.04]" />
      <Image
        src={item.imageUrl}
        alt={item.caption}
        fill
        priority={priority}
        sizes="(max-width: 1024px) 100vw, 60vw"
        className="object-cover object-center transition-transform duration-[900ms] ease-out group-hover:scale-[1.045]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-executive-black/80 via-executive-black/15 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 z-20 px-6 pb-7 pt-10 sm:px-8 sm:pb-8">
        <span className="mb-2.5 block h-px w-8 origin-left bg-gold-prestige/70 transition-transform duration-200 ease-out group-hover:scale-x-[1.75]" />
        <p className="line-clamp-2 font-montserrat text-xs font-medium uppercase leading-relaxed tracking-[0.2em] text-white/80 transition-colors duration-200 ease-out group-hover:text-white sm:text-sm">
          {item.caption}
        </p>
      </div>
    </motion.div>
  );
}

function GalleryGrid({ items, reducedMotion }: { items: GalleryItem[]; reducedMotion: boolean }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const inView = useInViewSafe(gridRef, { once: true, margin: '-80px' });
  const layouts = useMemo(() => getGridLayout(items.length), [items.length]);

  return (
    <div ref={gridRef} className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
      {items.map((item, i) => (
        <GalleryCard
          key={item.id}
          item={item}
          index={i}
          className={layouts[i]}
          inView={inView}
          reducedMotion={reducedMotion}
          priority={i === 0}
        />
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Slide do carrossel (mobile SEMPRE + desktop quando > 3 imagens)
 ──────────────────────────────────────────────────────────── */
function GallerySlideCard({
  item,
  variant,
  active,
  onSelect,
}: {
  item: GalleryItem;
  variant: 'mobile' | 'desktop';
  active: boolean;
  onSelect: () => void;
}) {
  const isMobile = variant === 'mobile';

  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={item.caption}
      // Clicar no card centraliza/destaca esse slide (equivalente a clicar
      // no dot correspondente). Isso resolve o problema relatado no
      // desktop: com poucos itens, avançar só pela seta nem sempre chega
      // ao final da lista — clicar diretamente no card visível (mesmo que
      // parcialmente, fora do centro) dá um caminho direto e confiável
      // até qualquer slide, sem depender de scrollNext() repetido.
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      tabIndex={0}
      className={cn(
        'group relative shrink-0 origin-center cursor-pointer overflow-hidden rounded-lg',
        'ring-1 ring-white/[0.06] transition-[transform,opacity,box-shadow] duration-300 ease-out',
        'hover:ring-gold-prestige/30 hover:shadow-[0_4px_24px_rgba(212,175,55,0.15)]',
        'focus-visible:ring-2 focus-visible:ring-gold-prestige/60',
        isMobile ? 'aspect-[4/5] basis-[80%]' : 'h-[28rem] w-[22rem]',
        active ? 'scale-100 opacity-100' : 'scale-[0.92] opacity-55',
      )}
    >
      {/* next/image (em vez de <img> cru): roda a URL do Cloudinary pelo
          otimizador do Next (res.cloudinary.com está em remotePatterns no
          next.config) e, via `sizes`, pede a variante dimensionada para a
          largura real do slide — ~352px no desktop (w-[22rem]), ~60vw no
          mobile/tablet (slide basis-[80%] dentro do viewport embla com
          padding 10% cada lado = ~64% da largura externa). Sem `sizes`,
          next/image com `fill` cairia no default de 100vw, servindo uma
          variante de largura de tela cheia; o <img> cru original era pior
          ainda — servia a URL do Cloudinary em resolução original (1920w+).
          Isso corta o peso de cada decodificação de ~1920w para ~750w
          (mesmo em DPR 2-3x), reduzindo a pressão de memória por slide.

          Mesma forma do <Image> do GalleryCard (grid) acima: `fill` (o
          container pai é `relative` + CSS-bounded — ver wrapper do slide
          — então o fill é determinístico e não depende de posicionamento
          do embla; o embla só translada o slide via transform, sem afetar
          o box do filho absoluto). `loading="lazy"` em todos os slides: a
          galeria é abaixo da dobra (não-LCP), então nenhum slide é
          "visível no mount" da seção — a cláusula de exceção do prompt
          não se aplica. Sem `priority` (não compete com Hero/Founders/Nav
          pelos primeiros MB no boot do iOS) e sem `quality` (default 75,
          já no array `qualities` do next.config — não elevar para imagem
          pequena, é mais que suficiente). */}
      <Image
        src={item.imageUrl}
        alt={item.caption}
        fill
        loading="lazy"
        sizes="(min-width: 1024px) 352px, 60vw"
        className="object-cover object-center transition-transform duration-[900ms] ease-out group-hover:scale-[1.045]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-executive-black/90 via-executive-black/25 to-transparent" />

      {/* Zona de legenda com altura reservada e padding fixo — nunca encolhe
          por breakpoint e nunca é invadida pelo texto (line-clamp-2). */}
      <div className="absolute inset-x-0 bottom-0 px-5 pb-8 pt-12 sm:px-6 sm:pb-9">
        <span className="mb-2.5 block h-px w-7 origin-left bg-gold-prestige/70 transition-transform duration-200 ease-out group-hover:scale-x-[1.6]" />
        <p className="line-clamp-2 font-montserrat text-[0.7rem] font-medium uppercase leading-relaxed tracking-[0.18em] text-white/85 sm:text-xs">
          {item.caption}
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Loop seguro — mede o DOM real (não assume contagem de itens)

   Causa raiz do Bug 1: com `loop: true`, o Embla precisa que a largura
   total do conteúdo (slides + gaps) seja pelo menos ~2x a largura do
   viewport do carrossel para gerar clones e snap points corretos. Com
   poucos itens / slides largos essa condição não é atingida e a
   navegação trava depois do 2º slide.

   Em vez de "if (items.length >= N) loop = true" — que quebra assim que
   o tamanho do slide, o gap ou o breakpoint mudarem — este hook mede a
   largura real do container e do conteúdo no DOM (no mount + resize) e
   só ativa o loop quando há overflow suficiente para ele funcionar de
   forma confiável. Funciona igual para 4, 6, 8+ imagens sem números
   mágicos.

   CORREÇÃO (bug "primeiro slide colado no último" no mobile): o mobile
   usa align:'center' + padding lateral de 10% no viewport (o "peek" que
   dá o respiro nas pontas — ver comentário no container do embla mais
   abaixo). loop:true combinado com padding no viewport é uma combinação
   que o Embla não resolve de forma confiável: o ponto de rewind dos
   clones não leva esse padding em conta, e o resultado visual é
   exatamente o bug relatado — o clone do primeiro slide aparece colado
   no último assim que o carrossel tenta fechar o loop. Por isso, para
   variant 'mobile' este hook agora sai antes de promover o loop, e o
   carrossel permanece sempre loop:false (definido em baseOptions) nesse
   caso — comportamento linear, que é o correto para o padrão de peek
   com padding. O desktop (sem padding, align:'start') não é afetado por
   este early-return e continua com a promoção dinâmica exatamente como
   antes.
──────────────────────────────────────────────────────────── */
function useSafeLoop(
  emblaApi: EmblaCarouselType | undefined,
  baseOptions: EmblaOptionsType,
  plugins: Parameters<typeof useEmblaCarousel>[1],
  variant: 'mobile' | 'desktop',
) {
  const loopEnabledRef = useRef(false);

  useEffect(() => {
    if (!emblaApi) return;

    // Mobile nunca promove loop — ver justificativa no comentário acima
    // da função. Isso resolve o bug de "primeiro slide colado no último"
    // sem tocar em nenhum comportamento do desktop.
    if (variant === 'mobile') return;

    const evaluate = () => {
      const container = emblaApi.containerNode();
      const slides = emblaApi.slideNodes();
      if (!container || slides.length === 0) return;

      const containerWidth = container.getBoundingClientRect().width;
      const firstSlide = slides[0];
      const lastSlide = slides[slides.length - 1];
      const contentWidth =
        lastSlide.getBoundingClientRect().right - firstSlide.getBoundingClientRect().left;

      // Regra prática do Embla: overflow >= 2x o viewport do carrossel
      // é necessário para clones/snap points de loop confiáveis.
      const isLoopSafe = containerWidth > 0 && contentWidth >= containerWidth * 2;

      if (isLoopSafe !== loopEnabledRef.current) {
        loopEnabledRef.current = isLoopSafe;
        emblaApi.reInit({ ...baseOptions, loop: isLoopSafe }, plugins);
      }
    };

    // Uma medição imediata + uma no próximo frame (garante que fontes/
    // imagens já reservaram o espaço de layout antes de medir).
    evaluate();
    const raf = requestAnimationFrame(evaluate);

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedEvaluate = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(evaluate, 150);
    };

    window.addEventListener('resize', debouncedEvaluate);
    return () => {
      cancelAnimationFrame(raf);
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener('resize', debouncedEvaluate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emblaApi, variant]);
}

function GalleryCarousel({
  items,
  variant,
  reducedMotion,
}: {
  items: GalleryItem[];
  variant: 'mobile' | 'desktop';
  reducedMotion: boolean;
}) {
  const isMobile = variant === 'mobile';

  // Começa com loop:false — estado seguro por padrão. O useSafeLoop
  // promove para loop:true via reInit somente se o DOM confirmar que
  // há overflow suficiente (ver comentário acima do hook) E a variante
  // for 'desktop'. No mobile permanece sempre loop:false.
  const baseOptions: EmblaOptionsType = useMemo(
    () => ({
      loop: false,
      align: isMobile ? 'center' : 'start',
      dragFree: false, // snapping previsível em ambos — dragFree causava
      // pontos de parada irregulares e travava a navegação
      // por botão/dot no desktop
      skipSnaps: false,
      // Causa raiz real do "só navega até o slide 2": o padrão do Embla é
      // containScroll: 'trimSnaps', que REMOVE/funde os snap points finais
      // sempre que rolar até eles ultrapassaria o limite do conteúdo. Com
      // slides largos (22rem) e poucos itens, os snap points dos últimos
      // slides colapsavam no mesmo ponto do 2º slide — por isso
      // scrollTo(2)/scrollTo(3) (seta, dot OU clique no card) parava no
      // mesmo lugar e selectedScrollSnap() nunca mudava.
      // 'keepSnaps' mantém cada slide como um índice de snap distinto
      // (selectedIndex/active/contador passam a refletir o slide certo),
      // só limitando a posição de rolagem para não sobrar espaço vazio
      // depois do último slide.
      containScroll: 'keepSnaps',
    }),
    [isMobile],
  );

  const plugins = useMemo(
    () => (isMobile || reducedMotion ? [] : [Autoplay({ delay: 4500, stopOnInteraction: true })]),
    [isMobile, reducedMotion],
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(baseOptions, plugins);

  useSafeLoop(emblaApi, baseOptions, plugins, variant);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  useEffect(() => {
    if (!emblaApi) return;
    const sync = (api: EmblaCarouselType) => {
      setSelectedIndex(api.selectedScrollSnap());
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };
    emblaApi.on('select', sync);
    emblaApi.on('reInit', sync);
    sync(emblaApi);
    return () => {
      emblaApi.off('select', sync);
      emblaApi.off('reInit', sync);
    };
  }, [emblaApi]);

  // stopOnInteraction do Autoplay só escuta pointerDown DENTRO do viewport
  // do carrossel — cliques em botões/dots (que ficam fora dele) nunca o
  // desarmam, e é isso que causava o "recuo/avanço fantasma" alguns
  // instantes depois de uma navegação manual. Paramos o plugin
  // explicitamente sempre que o usuário navega por botão ou dot.
  const stopAutoplay = useCallback(() => {
    const autoplay = emblaApi?.plugins()?.autoplay as { stop: () => void } | undefined;
    autoplay?.stop();
  }, [emblaApi]);

  const scrollPrev = useCallback(() => {
    stopAutoplay();
    emblaApi?.scrollPrev();
  }, [emblaApi, stopAutoplay]);

  const scrollNext = useCallback(() => {
    stopAutoplay();
    emblaApi?.scrollNext();
  }, [emblaApi, stopAutoplay]);

  const scrollTo = useCallback(
    (index: number) => {
      stopAutoplay();
      emblaApi?.scrollTo(index);
    },
    [emblaApi, stopAutoplay],
  );

  return (
    <div className="relative">
      {/* Contador editorial + controles (desktop) */}
      <div className="mb-4 flex items-center justify-between">
        <span className="font-inter text-[0.7rem] font-medium uppercase tracking-[0.22em] text-white/40">
          <span className="text-gold-prestige">{String(selectedIndex + 1).padStart(2, '0')}</span>
          {' / '}
          {String(items.length).padStart(2, '0')}
        </span>

        {!isMobile && (
          <div className="flex items-center gap-2">
            <button
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              aria-label="Imagem anterior"
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/60',
                'transition-all duration-200 ease-out',
                canScrollPrev
                  ? 'hover:border-gold-prestige/50 hover:text-gold-prestige'
                  : 'cursor-not-allowed opacity-30',
              )}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={scrollNext}
              disabled={!canScrollNext}
              aria-label="Próxima imagem"
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/60',
                'transition-all duration-200 ease-out',
                canScrollNext
                  ? 'hover:border-gold-prestige/50 hover:text-gold-prestige'
                  : 'cursor-not-allowed opacity-30',
              )}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        <div
          ref={emblaRef}
          className="overflow-hidden"
          role="region"
          aria-roledescription="carousel"
          aria-label="Galeria de imagens"
          style={
            // Bug 2 — o "colado" nas pontas do mobile não é causado pelo
            // loop: é o padrão clássico do Embla com align:'center' sem
            // padding no container. Sem esse espaço reservado, não há
            // "para onde" centralizar o 1º/último slide, então eles ficam
            // encostados na borda em vez de manter o mesmo respiro dos
            // slides do meio. O padding lateral abaixo replica o peek
            // (100% - basis-80%) / 2 = 10% de cada lado. Como o mobile
            // agora nunca ativa loop (ver useSafeLoop), esse padding
            // funciona exatamente como projetado, sem o artefato de
            // clone colado nas transições de loop.
            isMobile ? { paddingLeft: '10%', paddingRight: '10%' } : undefined
          }
        >
          <div className={cn('flex', isMobile ? 'gap-4' : 'gap-6')}>
            {items.map((item, i) => (
              <GallerySlideCard
                key={item.id}
                item={item}
                variant={variant}
                active={i === selectedIndex}
                onSelect={() => scrollTo(i)}
              />
            ))}
          </div>
        </div>

        {!isMobile && (
          <>
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-executive-black to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-executive-black to-transparent" />
          </>
        )}
      </div>

      {/* Dots */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            aria-label={`Ir para imagem ${i + 1}`}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300 ease-out',
              selectedIndex === i ? 'w-6 bg-gold-prestige' : 'w-1.5 bg-white/25 hover:bg-white/40',
            )}
          />
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   Section principal
 ──────────────────────────────────────────────────────────── */
export default function GallerySection({ galleries }: { galleries: GalleryItem[] }) {
  // Diagnóstico de hidratação (temporário) — marca a PRIMEIRA renderização
  // do cliente. Guardado por ref para disparar uma única vez, nunca em
  // re-renders subsequentes. Fora de qualquer useEffect, conforme a
  // instrumentação solicitada. Nome 'gallery-render-start' (único — não
  // reutiliza 'hero-', 'nav-', 'testimonials-', 'founders-' ou
  // 'workshops-render-start', que já existem na mesma página /; cada
  // componente precisa de nome único na timeline do performance para o
  // getEntriesByName não-ambíguo).
  const galleryRenderMarkedRef = useRef(false);
  if (!galleryRenderMarkedRef.current) {
    galleryRenderMarkedRef.current = true;
    if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
      performance.mark('gallery-render-start');
    }
  }

  const sectionRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const heroInView = useInViewSafe(heroRef, { once: true, margin: '-80px' });
  const galleryRef = useRef<HTMLDivElement>(null);
  const galleryInView = useInViewSafe(galleryRef, { once: true, amount: 0.15 });
  const { isDesktop, mounted } = useIsDesktopViewport();

  // Diagnóstico de hidratação (temporário) — sinaliza que o mount efetivamente
  // terminou (passive effects rodaram). O delta real (mark → mount effects)
  // é calculado AQUI no cliente usando a mark 'gallery-render-start' criada
  // no topo do componente, e enviado como msSinceMark — o servidor só o exibe.
  // (performance.now() é relativo à navegação da página; subtrair de Date.now()
  // epoch não representaria tempo real nenhum.) GallerySection não tinha
  // useEffect de mount pré-existente, então este foi criado novo. Posicionado
  // ANTES do early return `if (galleries.length === 0) return null` — hooks
  // nunca podem vir depois de um return condicional (Rules of Hooks).
  useEffect(() => {
    const markName = 'gallery-render-start';
    const markEntry =
      typeof performance !== 'undefined' ? performance.getEntriesByName(markName)[0] : undefined;
    const msSinceMark = markEntry
      ? Math.round(performance.now() - markEntry.startTime)
      : null;

    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(
        '/api/debug-log',
        JSON.stringify({
          tag: 'GallerySection',
          msg: 'mount effects complete',
          msSinceMark,
        }),
      );
    } else {
      fetch('/api/debug-log', {
        method: 'POST',
        body: JSON.stringify({
          tag: 'GallerySection',
          msg: 'mount effects complete',
          msSinceMark,
        }),
        keepalive: true,
      });
    }
  }, []);

  if (galleries.length === 0) return null;

  const isCompact = galleries.length <= 3;

  return (
    <Section ref={sectionRef} sectionId="gallery" bg="black" data-testid="gallery-section">
      <div className="pointer-events-none absolute right-0 top-1/3 h-[50rem] w-[50rem] rounded-full bg-gold-prestige/[0.03] blur-[200px]" />
      <Container className="relative z-10">
        {/* Header */}
        <motion.div
          ref={heroRef}
          initial={{ opacity: 0 }}
          animate={heroInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 sm:mb-16 lg:mb-20"
        >
          <span className="section-label">03 — MOMENTOS</span>
          <h2 className="mt-6 max-w-4xl font-cinzel text-4xl font-light leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
            A Imagem da
            <br />
            <span className="text-gold-prestige">Excelência</span>
          </h2>
        </motion.div>

        {/* Só uma variante é montada por vez, decidido em JS (não CSS) —
            ver comentário no hook useIsDesktopViewport acima. `mounted`
            evita montar a variante errada por uma fração de segundo antes
            do primeiro matchMedia rodar no cliente. */}
        {mounted && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7, ease: EASE_CINEMATIC }}
          >
            {isDesktop ? (
              isCompact ? (
                <GalleryGrid items={galleries} reducedMotion={reducedMotion} />
              ) : (
                <GalleryCarousel items={galleries} variant="desktop" reducedMotion={reducedMotion} />
              )
            ) : (
              <GalleryCarousel items={galleries} variant="mobile" reducedMotion={reducedMotion} />
            )}
          </motion.div>
        )}
      </Container>
    </Section>
  );
}
