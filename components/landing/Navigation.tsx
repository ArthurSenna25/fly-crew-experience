'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
interface NavLink {
  id: string;
  label: string;
}

const LINKS: NavLink[] = [
  { id: 'experience', label: 'Experiência' },
  { id: 'founders', label: 'Fundadoras' },
  { id: 'workshops', label: 'Workshops' },
  { id: 'gallery', label: 'Galeria' },
  { id: 'testimonials', label: 'Depoimentos' },
  { id: 'contact', label: 'Contato' },
];

const LOGO_URL = '/images/logo/logo.png';
const EASE_CINEMATIC = [0.16, 1, 0.3, 1] as const;

export default function Navigation() {
  // Diagnóstico de hidratação (temporário) — marca a PRIMEIRA renderização
  // do cliente. Guardado por ref para disparar uma única vez, nunca em
  // re-renders subsequentes. Fora de qualquer useEffect, conforme a
  // instrumentação solicitada (não lê nem escreve dados — só perf API).
  const navRenderMarkedRef = useRef(false);
  if (!navRenderMarkedRef.current) {
    navRenderMarkedRef.current = true;
    if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
      performance.mark('nav-render-start');
    }
  }

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const [logoError, setLogoError] = useState(false);
  const reducedMotion = useReducedMotion();

  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // Id estático (não useId): só existe um menu mobile por página, e um valor
  // fixo garante que o aria-controls seja idêntico entre servidor e cliente —
  // useId pode divergir se a árvore acima contar hooks de forma diferente
  // entre SSR e hidratação, causando o erro de hydration mismatch.
  const menuId = 'fly-crew-mobile-menu';

  /* ── Barra de progresso de leitura — hairline discreto, GPU-only
        (transform apenas, nunca width).

        Antes usava useScroll + useSpring do Framer Motion, o que força
        um recálculo (e potencialmente um re-render) a cada evento de
        scroll, com física de mola por cima. Trocado por manipulação
        direta do DOM via ref: escrevemos em `element.style.transform`
        fora do ciclo de render do React, e usamos requestAnimationFrame
        pra nunca atualizar mais de uma vez por frame de tela, mesmo que
        o navegador dispare o evento `scroll` várias vezes seguidas
        (comum em scroll rápido no mobile). Perde a suavização de mola
        do useSpring, mas numa barra de 2px isso não é perceptível, e o
        ganho de performance é maior que o efeito visual perdido. */
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressRafRef = useRef<number | null>(null);

  useEffect(() => {
    const updateProgress = () => {
      progressRafRef.current = null;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;
      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${progress})`;
      }
    };

    const onProgressScroll = () => {
      if (progressRafRef.current === null) {
        progressRafRef.current = requestAnimationFrame(updateProgress);
      }
    };

    updateProgress(); // estado inicial (ex: navegação por âncora já carrega scrollado)
    window.addEventListener('scroll', onProgressScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onProgressScroll);
      if (progressRafRef.current !== null) cancelAnimationFrame(progressRafRef.current);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Intersection Observer para destacar a seção ativa ── */
  useEffect(() => {
    const sections = [
      'experience',
      'founders',
      'workshops',
      'gallery',
      'testimonials',
      'community',
      'contact',
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { root: null, rootMargin: '0px', threshold: 0.4 },
    );

    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    // Diagnóstico de hidratação (temporário) — sinaliza que os efeitos de
    // mount terminaram. O delta real (mark → mount effects) é calculado AQUI
    // no cliente usando a mark 'nav-render-start' criada no topo do
    // componente, e enviado como msSinceMark — o servidor só o exibe.
    // (Antes enviávamos ts=performance.now() e o endpoint fazia Date.now()-ts,
    // que é incorreto: performance.now() é relativo à navegação da página e
    // Date.now() é epoch — a subtração não representava tempo real nenhum.)
    const markName = 'nav-render-start';
    const markEntry =
      typeof performance !== 'undefined' ? performance.getEntriesByName(markName)[0] : undefined;
    const msSinceMark = markEntry
      ? Math.round(performance.now() - markEntry.startTime)
      : null;

    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(
        '/api/debug-log',
        JSON.stringify({
          tag: 'Navigation',
          msg: 'mount effects complete',
          msSinceMark,
        }),
      );
    } else {
      fetch('/api/debug-log', {
        method: 'POST',
        body: JSON.stringify({
          tag: 'Navigation',
          msg: 'mount effects complete',
          msSinceMark,
        }),
        keepalive: true,
      });
    }

    return () => observer.disconnect();
  }, []);

  /* ── Trava de scroll do body enquanto o menu mobile está aberto,
        compensando a largura da scrollbar pra não gerar layout shift ── */
  useEffect(() => {
    if (!mobileOpen) return undefined;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [mobileOpen]);

  /* ── Focus trap + fechar com Escape + devolver foco ao toggle ── */
  useEffect(() => {
    if (!mobileOpen) return undefined;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusable = () =>
      menuRef.current
        ? Array.from(
            menuRef.current.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ),
          )
        : [];

    const focusTimer = window.setTimeout(() => {
      getFocusable()[0]?.focus();
    }, 60);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        return;
      }
      if (e.key === 'Tab') {
        const items = getFocusable();
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus();
    };
  }, [mobileOpen]);

  const scrollTo = (id: string) => {
    if (id === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.getElementById(id);
      if (element) {
        const navHeight = 64;
        const top = element.getBoundingClientRect().top + window.pageYOffset - navHeight;
        window.scrollTo({ top, behavior: 'smooth' });
      } else {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setMobileOpen(false);
  };

  const menuVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: reducedMotion ? 0 : 0.3,
        ease: EASE_CINEMATIC,
        staggerChildren: reducedMotion ? 0 : 0.05,
        delayChildren: reducedMotion ? 0 : 0.12,
      },
    },
    exit: { opacity: 0, transition: { duration: reducedMotion ? 0 : 0.2, ease: EASE_CINEMATIC } },
  };

  const linkVariants = {
    hidden: { opacity: 0, x: reducedMotion ? 0 : -18 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: reducedMotion ? 0 : 0.45, ease: EASE_CINEMATIC },
    },
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: EASE_CINEMATIC }}
      className="fixed top-0 w-full z-50"
      aria-label="Navegação principal"
      data-testid="main-navigation"
    >
    {/* Camada de fundo separada do <nav> — precisa ficar aqui, e não
       na tag <nav>, porque backdrop-filter num ancestral quebra o
       position:fixed do menu mobile (containing block do CSS). */}
    <div
      aria-hidden="true"
      className={cn(
        'absolute inset-0 -z-10 theme-transition transition-colors duration-700',
        isScrolled
          ? 'bg-executive-black/95 border-b border-white/10 md:bg-executive-black/90 md:backdrop-blur-2xl'
          : 'bg-transparent border-b border-transparent',
      )}
    />
      {/*
        NOTA DE ESPAÇAMENTO — leia antes de mexer aqui:
        Este container é `max-w-7xl` (1280px). Ou seja, a partir de um
        viewport de 1280px, a largura interna disponível NUNCA cresce — é
        sempre ~1280px menos o padding horizontal, não importa se o monitor
        é 1440px, 1536px ou 4K. Por isso os valores de gap/padding abaixo
        são fixos a partir de `xl` e não crescem em breakpoints maiores —
        crescer ali não ganha espaço nenhum, só garante overflow (foi
        exatamente o bug do print anterior).
      */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 xl:py-5">
        <div className="relative z-50 flex items-center justify-between gap-4">
          {/* Logo */}
          <motion.button
            type="button"
            className="group flex shrink-0 items-center gap-3 cursor-pointer transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => scrollTo('hero')}
            aria-label="Ir para o início"
            data-testid="logo"
          >
            <div className="relative h-11 w-11 shrink-0 md:h-12 md:w-12">
              {!logoError ? (
                <Image
                  src={LOGO_URL}
                  alt="Fly Crew Logo"
                  fill
                  priority
                  sizes="48px"
                  className="object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full border border-gold-prestige/40 font-cinzel text-lg text-gold-prestige">
                  FC
                </div>
              )}
            </div>

            <div className="relative shrink-0">
              <span className="relative z-10 whitespace-nowrap font-cinzel text-xl font-light tracking-[0.2em] text-white md:text-2xl">
                FLY CREW
              </span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-2 bg-gradient-to-r from-gold-prestige/0 via-gold-prestige/10 to-gold-prestige/0 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"
              />
            </div>
          </motion.button>

          {/* Desktop Navigation — só a partir de xl (1280px). Abaixo disso o
              container já não tem largura suficiente pra 6 links + CTA sem
              espremer (ver nota acima); o menu mobile assume nesse intervalo,
              o que é padrão em sites com esse volume de itens de nav. */}
          <div className="hidden min-w-0 xl:flex xl:items-center xl:gap-3">
            {LINKS.map((link, idx) => {
              const isActive = activeSection === link.id;
              return (
                <motion.button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className={cn(
                    'group relative flex shrink-0 items-center gap-1.5 whitespace-nowrap py-2 text-sm font-inter font-medium tracking-wide transition-colors duration-200',
                    isActive ? 'text-gold-prestige' : 'text-silver-mist hover:text-white',
                  )}
                  aria-current={isActive ? 'true' : undefined}
                  data-testid={`nav-${link.id}`}
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 + 0.35, duration: 0.5, ease: EASE_CINEMATIC }}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'font-inter text-[0.6rem] tracking-widest transition-colors duration-200',
                      isActive
                        ? 'text-gold-prestige'
                        : 'text-white/25 group-hover:text-gold-prestige/60',
                    )}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  {link.label}

                  {/* Sublinhado de hover — transform apenas, nunca width */}
                  {!isActive && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-gradient-to-r from-gold-prestige to-transparent transition-transform duration-300 ease-out group-hover:scale-x-100"
                    />
                  )}

                  {/* Indicador da seção ativa — shared layout, desliza entre
                      os links conforme o scroll (FLIP do Framer, GPU-only) */}
                  {isActive && (
                    <motion.span
                      layoutId="active-nav-underline"
                      aria-hidden="true"
                      className="pointer-events-none absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-gold-prestige to-transparent"
                      transition={
                        reducedMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 380, damping: 32 }
                      }
                    />
                  )}
                </motion.button>
              );
            })}

            {/* CTA — SEM troca de cor no hover. O texto é sempre dourado; o
                hover só encorpa o próprio dourado em baixa opacidade
                (bg-gold-prestige/10) + um glow suave. Nada de preto, nada de
                crossfade de cor — e por isso nada do tom marrom/sujo do print. */}
            <motion.button
              onClick={() => scrollTo('contact')}
              className="group relative ml-2 flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-gold-prestige px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-gold-prestige transition-all duration-200 hover:bg-gold-prestige/10 hover:shadow-[0_4px_20px_rgba(212,175,55,0.25)] hover:scale-[1.03] active:scale-[0.97]"
              data-testid="nav-contact-btn"
            >
              Quero Fazer Parte
              <ArrowUpRight
                size={14}
                className="shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </motion.button>
          </div>

          {/* Mobile/Tablet Toggle — 44px de alvo de toque, ícone com morph
              suave. Ativo até xl (1280px), acompanhando o breakpoint do
              menu desktop acima. */}
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition-colors duration-300 hover:bg-white/5 xl:hidden"
            data-testid="mobile-menu-toggle"
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileOpen}
            aria-controls={menuId}
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileOpen ? (
                <motion.span
                  key="close"
                  initial={{ opacity: 0, rotate: reducedMotion ? 0 : -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: reducedMotion ? 0 : 90 }}
                  transition={{ duration: reducedMotion ? 0 : 0.2, ease: EASE_CINEMATIC }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <X size={22} />
                </motion.span>
              ) : (
                <motion.span
                  key="open"
                  initial={{ opacity: 0, rotate: reducedMotion ? 0 : 90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: reducedMotion ? 0 : -90 }}
                  transition={{ duration: reducedMotion ? 0 : 0.2, ease: EASE_CINEMATIC }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Menu size={22} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Mobile Menu — dialog completo: focus trap, Escape, scroll lock.
            Ativo até xl, mesmo breakpoint do toggle acima. */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              ref={menuRef}
              id={menuId}
              role="dialog"
              aria-modal="true"
              aria-label="Menu de navegação"
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-x-3 top-20 bottom-3 z-40 overflow-y-auto rounded-3xl border border-white/10 bg-executive-black shadow-2xl xl:hidden"
              style={{
                backgroundImage:
                  'radial-gradient(120% 60% at 50% 0%, rgba(212,175,55,0.06) 0%, transparent 60%)',
              }}
              data-testid="mobile-menu"
            >
              <div className="flex min-h-full flex-col gap-2 px-6 pb-6 pt-8">
                <nav className="flex flex-col gap-1" aria-label="Seções do site">
                  {LINKS.map((link, idx) => {
                    const isActive = activeSection === link.id;
                    return (
                      <motion.button
                        key={link.id}
                        variants={linkVariants}
                        onClick={() => scrollTo(link.id)}
                        className={cn(
                          'group flex items-center gap-4 rounded-lg px-3 py-3.5 text-left transition-colors duration-200',
                          isActive
                            ? 'text-gold-prestige'
                            : 'text-silver-mist hover:bg-white/5 hover:text-white',
                        )}
                        aria-current={isActive ? 'true' : undefined}
                      >
                        <span
                          className={cn(
                            'numeral-mark text-2xl',
                            isActive && 'text-gold-prestige/40',
                          )}
                          aria-hidden="true"
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="font-inter text-xl font-medium tracking-wide">
                          {link.label}
                        </span>
                        {isActive && (
                          <span
                            aria-hidden="true"
                            className="ml-auto h-1.5 w-1.5 rounded-full bg-gold-prestige"
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </nav>

                <motion.button
                  variants={linkVariants}
                  onClick={() => scrollTo('contact')}
                  className="mt-4 flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-gold-prestige bg-gold-prestige/10 px-6 py-4 text-sm font-semibold uppercase tracking-wider text-gold-prestige transition-colors duration-300 hover:bg-gold-prestige hover:text-executive-black"
                >
                  Quero Fazer Parte
                  <ArrowUpRight size={16} className="shrink-0" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Barra de progresso de leitura — hairline de 2px, transform-only.
          scaleX começa em 0 (definido inline) e é atualizado direto via
          ref no useEffect acima, sem passar pelo React a cada scroll. */}
      <div
        ref={progressBarRef}
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-gold-prestige via-gold-prestige to-gold-prestige/40"
        style={{ transform: 'scaleX(0)' }}
      />
    </motion.nav>
  );
}
