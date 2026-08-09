'use client';

import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';

// useLayoutEffect mede/sincroniza o DOM ANTES do paint — essencial para um
// FLIP sem flicker (precisamos aplicar o "invert" antes de o usuário ver a
// nova posição layout). Em SSR o useLayoutEffect emita warning; este wrapper
// cai pra useEffect no servidor e mantém o import fixo no cliente.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
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

// Pacing exato dos variants do Framer que foram removidos nesta Fase B3,
// mantidos como constantes nomeadas para o timing permanecer auditável.
const HAMBURGER_DURATION = 0.2; // s — morph X/Menu
const LINK_DURATION = 0.45; // s — entrada de cada link
const LINK_STAGER = 0.05; // s — passo do stagger (staggerChildren)
const LINK_DELAY_BASE = 0.12; // s — atraso inicial (delayChildren)
const MENU_CLOSE_DURATION = 0.2; // s — fade de saída do painel

// Easing comum (espelha EASE_CINEMATIC de lib/motion.ts = [0.16,1,0.3,1]),
// aqui como string pronta p/ CSS transition/animation inline — usado nos
// spans do morph X/Menu e na transition de saída do painel (Fase B3).
const CSS_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

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
  // `closing` mantém o painel do menu mobile montado por mais um ciclo após
  // `mobileOpen` virar false, para permitir uma SAÍDA animada por CSS
  // (transition opacity→0). Fruto da Fase B3: AnimatePresence do Framer fazia
  // isso nativamente (mantinha o nó montado durante o `exit`); sem Framer,
  // o React desmontaria imediatamente e a transition não teria chance de
  // rodar. `menuMounted = mobileOpen || closing` é a condição de render.
  const [closing, setClosing] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const [logoError, setLogoError] = useState(false);
  const reducedMotion = useReducedMotion();

  const toggleRef = useRef<HTMLButtonElement>(null);
  // `menuRef` DEVE permanecer anexado durante a saída animada (closing=true)
  // da Fase B3 — o focus-trap/Escape effect (deps [mobileOpen]) só registra
  // o listener enquanto `mobileOpen`; mas o devolver-foco/scroll-lock do
  // body já corre no cleanup. O painel continua visível (em fade) via
  // `menuMounted`, e `menuRef` segue válido, sem孩子们 referência pendurada.
  const menuRef = useRef<HTMLDivElement>(null);
  // Id estático (não useId): só existe um menu mobile por página, e um valor
  // fixo garante que o aria-controls seja idêntico entre servidor e cliente —
  // useId pode divergir se a árvore acima contar hooks de forma diferente
  // entre SSR e hidratação, causando o erro de hydration mismatch.
  const menuId = 'fly-crew-mobile-menu';

  // ── Fase B3: unmount-deferred para o menu mobile (substitui AnimatePresence).
  // `closeTimerRef` agenda o desmonte real após a transition de saída; o
  // cleanup no unmount cancela o timer. `mobileOpenRef` espelha `mobileOpen`
  // via ref para que `closeMenu`/`toggleMenu` possam ser `useCallback`
  // estáveis (sem depender de `mobileOpen` no array de deps), evitando
  // re-instanciar os callbacks a cada toggle de estado.
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mobileOpenRef = useRef(mobileOpen);
  mobileOpenRef.current = mobileOpen;

  const closeMenu = useCallback(() => {
    // Guard via ref: se já está fechado/fechando, nada a fazer. Evita um
    // `setClosing(true)` spurious que remontaria o painel com a animation
    // de entrada (flash) quando `menuMounted` estava false.
    if (!mobileOpenRef.current) return;
    setMobileOpen(false);
    setClosing(true);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(
      () => {
        setClosing(false);
        closeTimerRef.current = null;
      },
      reducedMotion ? 0 : MENU_CLOSE_DURATION * 1000,
    );
  }, [reducedMotion]);

  const toggleMenu = useCallback(() => {
    if (mobileOpenRef.current) {
      closeMenu();
    } else {
      setMobileOpen(true);
      setClosing(false);
      // Aborta um fechamento em curso (re-abertura durante o fade de saída):
      // cancela o timer pendente e limpa `closing`, voltando ao estado "aberto".
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    }
  }, [closeMenu]);

  // Cancela o timer de fechamento pendente se o componente desmontar
  // enquanto ainda em fade-out (evita setState em componente desmontado).
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  // Render do painel enquanto abre OU durante o fade de saída (closing).
  const menuMounted = mobileOpen || closing;

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

  /* ── FLIP manual do underline da seção ativa — substitui o
        `layoutId="active-nav-underline"` do Framer Motion (shared-layout
        animation que desliza o underline entre os links conforme o
        scroll) por manipulação direta do DOM, REUSANDO o padrão
        rAF+direct-DOM já estabelecido neste arquivo (barra de progresso).
        Mantém a mola suave do comportamento original (stiffness 380,
        damping 32); em `prefers-reduced-motion` a transição é instantânea
        (espelha `transition={{ duration: 0 }}` do Framer).

        FLIP = First-Last-Invert-Play:
        1. FIRST: retângulo atual do underline (posição/ tamanho antigos,
          まだ layout não reescrito).
        2. LAST: define o novo alvo de layout — `left`/`width`/`top` do
           novo link ativo. Setado UMA VEZ por transição, não por frame
           (propriedades animadas por frame são SÓ `transform` — GPU-only,
           conforme Regra #15; `left`/`width`/`top` são alvo de layout, não
           valor animado).
        3. INVERT: aplica `transform: translateX(first.x - last.x)
           scaleX(first.width / last.width)` com `origin-left` para o
           underline aparecer visualmente na posição antiga apesar de já
           ter o novo layout.
        4. PLAY: anima `transform` até a identidade (translateX(0)
           scaleX(1)) via loop de rAF com integração de mola
           semi-implícita (Euler). Critério de parada por settling. */
  const linksContainerRef = useRef<HTMLDivElement>(null);
  const underlineRef = useRef<HTMLSpanElement>(null);
  const underlineRafRef = useRef<number | null>(null);

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

  /* ── FLIP manual do underline da seção ativa — substitui o
        `motion.span layoutId="active-nav-underline"` do Framer Motion
        (shared-layout animation que desliza o underline entre os links
        conforme o scroll muda a seção ativa) por manipulação direta do
        DOM, REUSANDO o padrão rAF+direct-DOM já estabelecido neste
        arquivo (barra de progresso de leitura). Mantém a mola suave do
        comportamento original (stiffness 380, damping 32); em
        `prefers-reduced-motion` a transição é instantânea, espelhando o
        `transition={{ duration: 0 }}` do Framer.

        Roda em useLayoutEffect (não useEffect) porque é uma animação de
        LAYOUT: precisamos aplicar o "invert" ANTES do paint para o
        usuário não ver o underline saltar instantaneamente pra nova
        posição antes de a mola começar.

        FLIP = First-Last-Invert-Play:
        1. FIRST: retângulo visual atual do underline (captura qualquer
           transform de uma transição anterior em andamento).
        2. LAST: define o novo alvo de layout — `left`/`width`/`top` do
           novo link ativo. Setado UMA VEZ por transição, não por frame
           (a propriedade animada por frame é SÓ `transform` — GPU-only,
           conforme Regra #15; `left`/`width`/`top` são alvo de layout,
           nunca valor animado por frame).
        3. INVERT: aplica `transform: translateX(first.x - last.x)
           scaleX(first.width / last.width)` com `origin-left` pra o
           underline aparecer visualmente na posição/tamanho antigos
           apesar de já ter o novo layout.
        4. PLAY: anima `transform` até a identidade (translateX(0)
           scaleX(1)) via loop de rAF com integração de mola
           semi-implícita (Euler), mesmos stiffness/damping do Framer. */
  useIsomorphicLayoutEffect(() => {
    const underline = underlineRef.current;
    const container = linksContainerRef.current;
    if (!underline || !container) return;

    // BISSEÇÃO — TESTE DE ISOLAMENTO (não restaurar ainda). Hipótese B.
    // Corpo do FLIP do underline DESATIVADO: retorna cedo, ANTES de qualquer
    // getBoundingClientRect/cálculo/mola/rAF (o guard de null acima é só
    // leitura de ref, não medição). Se o travamento de thread no iOS Safari
    // sumir com isto, o suspeito é o loop de rAF da mola (critério de
    // settling que pode nunca bater → rAF rodando indefinidamente) ou
    // re-trigger constante do effect por activeSection oscilar no
    // IntersectionObserver. O underline fica sem animação/posicionamento
    // nesta versão — esperado e aceitável temporariamente. Reverter após o
    // teste em produção confirmar/descartar a variável.
    //
    // `true as boolean` (tipo não-literal, não `true`) impede o TS de marcar
    // o corpo FLIP abaixo como unreachable. Um `return;` puro faria o TS
    // perder o narrowing de null do guard acima → 16 erros TS18047/TS2345 no
    // código inerte. Com `as boolean` o branch fica "reachable" para o
    // analisador (narrowing de underline/container persiste), mas em runtime
    // sempre retorna cedo — antes de qualquer getBoundingClientRect/mola/rAF.
    const flipDisabled = true as boolean;
    if (flipDisabled) return;

    // Sem seção ativa, ou seção sem link correspondente na nav (ex:
    // 'community' não está em LINKS) → esconde o underline. Espelha o
    // comportamento original, onde nenhum link isActive → nenhum
    // motion.span é renderizado.
    const newLink = activeSection
      ? container.querySelector<HTMLElement>(`[data-testid="nav-${activeSection}"]`)
      : null;
    if (!newLink) {
      underline.style.opacity = '0';
      underline.style.transform = 'none';
      if (underlineRafRef.current !== null) {
        cancelAnimationFrame(underlineRafRef.current);
        underlineRafRef.current = null;
      }
      return;
    }

    // FIRST: posição/tamanho visuais ATUAIS (antes de mudar o layout).
    const firstRect = underline.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const linkRect = newLink.getBoundingClientRect();

    const newLeft = linkRect.left - containerRect.left;
    const newWidth = linkRect.width;
    // 3px abaixo do fundo do link — mesmo posicionamento do `-bottom-1`
    // original (bottom:-4px + h-px → linha em [bottom+3, bottom+4]).
    const newTop = linkRect.bottom - containerRect.top + 3;

    const wasHidden = firstRect.width < 1 || underline.style.opacity === '0';

    // LAST: define o novo layout (uma vez — alvo de layout, não animado).
    underline.style.left = `${newLeft}px`;
    underline.style.top = `${newTop}px`;
    underline.style.width = `${newWidth}px`;
    underline.style.opacity = '1';

    // Primeira ativação ou reduced-motion → instantâneo (sem FLIP).
    // Espelha o aparecimento sem animação de um layoutId recém-montado e
    // o `duration: 0` do Framer em reduced-motion.
    if (reducedMotion || wasHidden) {
      underline.style.transform = 'none';
      return;
    }

    // INVERT: o underline já está no novo layout; aplicamos um transform
    // (GPU) com origin-left pra ele aparecer visualmente na posição/
    // tamanho antigos.
    const dx = firstRect.left - linkRect.left;
    const sx = firstRect.width > 0 && newWidth > 0 ? firstRect.width / newWidth : 1;
    underline.style.transform = `translateX(${dx}px) scaleX(${sx})`;

    // PLAY: mola anima o transform até a identidade. Semi-implicit Euler
    // (estável p/ molas), dt em segundos com clamp de 32ms pra evitar
    // saltos ao retomar de uma aba em background.
    const stiffness = 380;
    const damping = 32;
    let tx = dx;
    let sxNow = sx;
    let vtx = 0;
    let vsx = 0;
    let lastT = 0;

    const frame = (t: number) => {
      if (!lastT) lastT = t;
      const dt = Math.min((t - lastT) / 1000, 0.032);
      lastT = t;

      const ax = -stiffness * tx - damping * vtx;
      vtx += ax * dt;
      tx += vtx * dt;
      const asx = -stiffness * (sxNow - 1) - damping * vsx;
      vsx += asx * dt;
      sxNow += vsx * dt;

      underline.style.transform = `translateX(${tx}px) scaleX(${sxNow})`;

      const settled =
        Math.abs(tx) < 0.4 &&
        Math.abs(vtx) < 0.4 &&
        Math.abs(sxNow - 1) < 0.01 &&
        Math.abs(vsx) < 0.4;
      if (settled) {
        underline.style.transform = 'none';
        underlineRafRef.current = null;
        return;
      }
      underlineRafRef.current = requestAnimationFrame(frame);
    };

    if (underlineRafRef.current !== null) cancelAnimationFrame(underlineRafRef.current);
    underlineRafRef.current = requestAnimationFrame(frame);

    return () => {
      if (underlineRafRef.current !== null) {
        cancelAnimationFrame(underlineRafRef.current);
        underlineRafRef.current = null;
      }
    };
  }, [activeSection, reducedMotion]);

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
    closeMenu();
  };

  return (
    <>
    <nav
      className="nav-slide-down fixed top-0 w-full z-50"
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
          <button
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
          </button>

          {/* Desktop Navigation — só a partir de xl (1280px). Abaixo disso o
              container já não tem largura suficiente pra 6 links + CTA sem
              espremer (ver nota acima); o menu mobile assume nesse intervalo,
              o que é padrão em sites com esse volume de itens de nav. */}
          {/* `relative` + ref no container tornam o underline persistente um
              filho posicionável por `left`/`top`/`width` absolutos, sempre
              relativos a este container (FLIP medido contra containerRect). */}
          <div ref={linksContainerRef} className="relative hidden min-w-0 xl:flex xl:items-center xl:gap-3">
            {/* Underline ÚNICO e persistente da seção ativa. Substitui os
                N motion.span por-link com `layoutId="active-nav-underline"`
                (Framer shared-layout). Posição/tamanho (`left`/`top`/`width`)
                são escritos uma vez por transição pelo effect FLIP manual
                (`underlineRef` + useIsomorphicLayoutEffect); o deslize entre
                links é animado SÓ via `transform` (GPU), reusando o padrão
                rAF+direct-DOM da barra de progresso. Inicia invisível
                (opacity:0) — o effect o revela quando uma seção ativa tem
                link correspondente, espelhando o render condicional
                `{isActive && <motion.span/>}` original. */}
            <span
              ref={underlineRef}
              aria-hidden="true"
              className="pointer-events-none absolute h-px bg-gradient-to-r from-gold-prestige to-transparent origin-left"
              style={{ left: 0, top: 0, width: 0, opacity: 0 }}
            />
            {LINKS.map((link, idx) => {
              const isActive = activeSection === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className={cn(
                    'nav-link-in group relative flex shrink-0 items-center gap-1.5 whitespace-nowrap py-2 text-sm font-inter font-medium tracking-wide transition-colors duration-200',
                    isActive ? 'text-gold-prestige' : 'text-silver-mist hover:text-white',
                  )}
                  style={{ animationDelay: `${idx * 0.08 + 0.35}s` }}
                  aria-current={isActive ? 'true' : undefined}
                  data-testid={`nav-${link.id}`}
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

                  {/* O underline da seção ATIVA deixou de ser um motion.span
                      por-link com `layoutId` (FLIP do Framer). Agora é um
                      ÚNICO span persistente, irmão dos links, posicionado
                      por `left`/`top`/`width` e animado via `transform`
                      pelo effect FLIP manual acima (rAF+direct-DOM).
                      Ver `underlineRef` + `useIsomorphicLayoutEffect`. */}
                </button>
              );
            })}

            {/* CTA — SEM troca de cor no hover. O texto é sempre dourado; o
                hover só encorpa o próprio dourado em baixa opacidade
                (bg-gold-prestige/10) + um glow suave. Nada de preto, nada de
                crossfade de cor — e por isso nada do tom marrom/sujo do print. */}
            <button
              onClick={() => scrollTo('contact')}
              className="group relative ml-2 flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-gold-prestige px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-gold-prestige transition-all duration-200 hover:bg-gold-prestige/10 hover:shadow-[0_4px_20px_rgba(212,175,55,0.25)] hover:scale-[1.03] active:scale-[0.97]"
              data-testid="nav-contact-btn"
            >
              Quero Fazer Parte
              <ArrowUpRight
                size={14}
                className="shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </button>
          </div>

          {/* Mobile/Tablet Toggle — 44px de alvo de toque, ícone com morph
              suave. Ativo até xl (1280px), acompanhando o breakpoint do
              menu desktop acima. */}
          <button
            ref={toggleRef}
            type="button"
            onClick={toggleMenu}
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition-colors duration-300 hover:bg-white/5 xl:hidden"
            data-testid="mobile-menu-toggle"
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileOpen}
            aria-controls={menuId}
          >
            {/*
              Morph hambúrguer ↔ X (Fase B3) — substitui o AnimatePresence
              mode="wait" (dois motion.span alternando com exit) por DOIS
              spans sempre montados que crossfadeam + giram via CSS
              transition, chaveados por `mobileOpen`. Como nenhum desmonta,
              a "exit animation" existe trivialmente (o ícone que sai faz
              opacity→0 + rotate ao mesmo tempo que o que entra faz
              opacity→1 + rotate inverso), sem unmount-deferred e sem o
              gap do mode="wait" (era exit-then-enter; agora crossfade
              simultâneo, mais solto a 0.2s). Sentido da rotação
              preservado do Framer: X sai p/ +90, Menu sai p/ -90.
            */}
            <span
              className="absolute inset-0 flex items-center justify-center"
              style={{
                opacity: mobileOpen ? 1 : 0,
                transform: reducedMotion ? 'none' : `rotate(${mobileOpen ? 0 : 90}deg)`,
                transition: reducedMotion
                  ? 'none'
                  : `opacity ${HAMBURGER_DURATION}s ${CSS_EASE}, transform ${HAMBURGER_DURATION}s ${CSS_EASE}`,
              }}
            >
              <X size={22} />
            </span>
            <span
              className="absolute inset-0 flex items-center justify-center"
              style={{
                opacity: mobileOpen ? 0 : 1,
                transform: reducedMotion ? 'none' : `rotate(${mobileOpen ? -90 : 0}deg)`,
                transition: reducedMotion
                  ? 'none'
                  : `opacity ${HAMBURGER_DURATION}s ${CSS_EASE}, transform ${HAMBURGER_DURATION}s ${CSS_EASE}`,
              }}
            >
              <Menu size={22} />
            </span>
          </button>
        </div>
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
    </nav>

      {/*
        Mobile Menu — dialog completo: focus trap, Escape, scroll lock.
        ELEVADO PARA FORA DO <nav> (bugfix da regressão Fase B3): antes, este
        painel `position:fixed` era filho do <nav>, que carrega
        `.nav-slide-down` (globals.css: `@keyframes navSlideDown { to {
        transform: translateY(0) } }` com `animation-fill-mode:both`). O fill
        `both` persiste `transform: translateY(0)` != `none` no <nav>, e,
        per specs CSS (texcontainingblock), qualquer `transform` != `none`
        num ancestral vira containing block de descendentes fixed → o painel
        passava a se posicionar relativo ao <nav> em vez do viewport. Em
        layout/coords desktop isso acidentalmente funcionava, mas a regra
        fixa `fixed inset-x-3 top-20 bottom-3` ficava presa nos limites do
        <nav> (top:0, w-full) — e em vários viewports o painel não cobria o
        agony visível ou aparecia atrás/clipped, dando a sensação de "menu
        não abre" (na verdade não abria num lugar visível). Mover para fora
        do <nav> (irmão dele, sob o fragmento) elimina o containing block
        transformado — `fixed` volta a ser relativo ao viewport. Mesma
        técnica já usada para isolar a camada de fundo com backdrop-filter
        (ver comentário no <div aria-hidden> acima), que pelo MESMO motivo
        também foi separada do <nav>.
      */}
      {/* Fase B3 detalhes de animação (inalterados pela bugfix): substitui
          <AnimatePresence>+motion.* por render em `menuMounted`
          (mobileOpen || closing). Entrada: .mobile-menu-in (opacity 0→1,
          0.3s) + .mobile-link-in escalonado (animation-delay idx*0.05+0.12).
          Saída: transition opacity→0 (MENU_CLOSE_DURATION) enquanto `closing`
          adia o desmount (unmount-deferred). As classes de entrada são
          gateadas em `mobileOpen` (não em menuMounted) pra serem removidas
          no fechamento → animation cancelada → transition de saída limpa
          (evita briga animation×transition em toggle rápido). Escape segue
          instantâneo (emil-design-eng: não animar ação iniciada por teclado).
      */}
      {menuMounted && (
        <div
          ref={menuRef}
          id={menuId}
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
          className={cn(
            'fixed inset-x-3 top-20 bottom-3 z-40 overflow-y-auto rounded-3xl border border-white/10 bg-executive-black shadow-2xl xl:hidden',
            mobileOpen && 'mobile-menu-in',
            mobileOpen ? 'opacity-100' : 'opacity-0',
          )}
          style={{
            transition: reducedMotion ? 'none' : `opacity ${MENU_CLOSE_DURATION}s ${CSS_EASE}`,
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
                  <button
                    key={link.id}
                    onClick={() => scrollTo(link.id)}
                    className={cn(
                      'group flex items-center gap-4 rounded-lg px-3 py-3.5 text-left transition-colors duration-200',
                      mobileOpen && 'mobile-link-in',
                      isActive
                        ? 'text-gold-prestige'
                        : 'text-silver-mist hover:bg-white/5 hover:text-white',
                    )}
                    style={{
                      animationDuration: reducedMotion ? '0ms' : `${LINK_DURATION * 1000}ms`,
                      animationDelay: reducedMotion
                        ? '0ms'
                        : `${(LINK_DELAY_BASE + idx * LINK_STAGER) * 1000}ms`,
                    }}
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
                  </button>
                );
              })}
            </nav>

            <button
              onClick={() => scrollTo('contact')}
              className={cn(
                'mt-4 flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-gold-prestige bg-gold-prestige/10 px-6 py-4 text-sm font-semibold uppercase tracking-wider text-gold-prestige transition-colors duration-300 hover:bg-gold-prestige hover:text-executive-black',
                mobileOpen && 'mobile-link-in',
              )}
              style={{
                animationDuration: reducedMotion ? '0ms' : `${LINK_DURATION * 1000}ms`,
                animationDelay: reducedMotion
                  ? '0ms'
                  : `${(LINK_DELAY_BASE + LINKS.length * LINK_STAGER) * 1000}ms`,
              }}
            >
              Quero Fazer Parte
              <ArrowUpRight size={16} className="shrink-0" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
