'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { useIsMobile } from '@/hooks/use-mobile';

// Placeholder minúsculo (8x5px) na cor de fundo da marca, com leve
// gradiente central — evita "flash" de área vazia enquanto a imagem
// real do Hero carrega (ela vem de um CDN externo, sem placeholder
// automático do Next.js para imagens remotas).
const HERO_BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAFCAIAAAD38zoCAAAANklEQVR4nE3NMQ4AQAgCQQ2W/v+3G64wZ5wOKMjuzkxJkiICAGzXtjMMoHTEUcDNfGX7bvvxAAboJyq84mzmAAAAAElFTkSuQmCC';

// Ajuste conforme a altura real do seu header fixo/sticky (em px).
// Se não houver header fixo, deixe 0.
const HEADER_OFFSET = 96;

// Micro-animações do Hero — PURAS em CSS (não dependem de hidratação do JS:
// as @keyframes e as classes já estão no HTML desde o SSR). GPU-friendly
// (só `transform`/`opacity`). prefers-reduced-motion desliga conforme Regra #14.
//
// 1) .hero-content-rise — "settle" sutil de translateY (12px→0), 480ms ease-out.
//    Sem animar opacity: no primeiro paint o texto já está visível em opacity:1,
//    o conteúdo apenas assenta de leve.
// 2) .hero-cue-fade — fade-in do scroll cue após 2.4s (1s ease-out). reduced-motion
//    → fade rápido sem delay (0.3s), espelhando o transition original do Framer
//    (delay: reducedMotion?0:2.4, duration: reducedMotion?0.3:1).
// 3) .hero-cue-pulse — pulso infinito scaleY 1→0.3→1 (2.8s) da linha do scroll
//    cue. Classe aplicada condicionalmente (isMobile||reducedMotion → omitida →
//    estático scaleY:1, default transform). reduced-motion também coberto por
//    @media por segurança (defesa em profundidade).
const HERO_CONTENT_RISE_CSS = `
@keyframes heroContentRise {
  from { transform: translateY(12px); }
  to   { transform: translateY(0); }
}
.hero-content-rise {
  animation: heroContentRise 480ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes heroCueFade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.hero-cue-fade {
  animation: heroCueFade 1s cubic-bezier(0.16, 1, 0.3, 1) 2.4s both;
}
@keyframes heroCuePulse {
  0%, 100% { transform: scaleY(1); }
  50%      { transform: scaleY(0.3); }
}
.hero-cue-pulse {
  animation: heroCuePulse 2.8s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}
@media (prefers-reduced-motion: reduce) {
  .hero-content-rise { animation: none; }
  .hero-cue-fade    { animation: heroCueFade 0.3s ease both; }
  .hero-cue-pulse    { animation: none; }
}
`;

const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
  e.preventDefault();
  const el = document.getElementById(id);

  if (!el) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[scrollTo] Nenhum elemento com id="${id}" encontrado na página.`);
    }
    return;
  }

  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
  window.scrollTo({ top, behavior: 'smooth' });
};

export default function HeroSection() {
  // Injeta a @keyframes da micro-animação de entrada do conteúdo uma única
  // vez no <head> (idempotente: só cria se ainda não existir). Feito no corpo
  // do componente (comparação + createElement DOM direto), sem useState/emplo
  // desem — SSL-safe: typeof document guard garante que o SSR no Next.js pule
  // esta escrita (não há document no servidor). A regra de que "todo acesso a
  // window/document DEVE estar dentro de useEffect" (Regra #14) se aplica a
  // leitura reativa de APIs que mudam e poderiam causar mismatch de hidratação;
  // aqui a escrita é puramente aditiva (criar uma tag <style> se ela não
  // existir) e não influencia a saída de render do React — segura no SSR.
  if (typeof document !== 'undefined' && !document.getElementById('hero-content-rise-css')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'hero-content-rise-css';
    styleEl.textContent = HERO_CONTENT_RISE_CSS;
    document.head.appendChild(styleEl);
  }

  // Diagnóstico de hidratação (temporário) — marca a PRIMEIRA renderização
  // do cliente. Guardado por ref para disparar uma única vez, nunca em
  // re-renders subsequentes. Fora de qualquer useEffect, conforme a
  // instrumentação solicitada. Nome 'hero-render-start' (não 'nav-render-start')
  // para não colidir com a mark do Navigation na mesma página — cada
  // componente precisa de nome único na timeline do performance.
  const heroRenderMarkedRef = useRef(false);
  if (!heroRenderMarkedRef.current) {
    heroRenderMarkedRef.current = true;
    if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
      performance.mark('hero-render-start');
    }
  }

  const sectionRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const reducedMotion = useReducedMotion();

  // Parallax scroll-driven via rAF + transform direto no DOM (fora do
  // render do React), padrão Navigation.tsx. Substitui useScroll/useTransform
  // do Framer — 1 listener scroll + 1 resize, 1 rAF compartilhado, progress
  // calculado uma vez e reaplicado nas 3 escritas (scale/opacity/y).
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const heroRafRef = useRef<number | null>(null);


  // Diagnóstico de hidratação (temporário) — sinaliza que o mount efetivamente
  // terminou (passive effects rodaram). HeroSection não tinha useEffect de mount
  // pré-existente, então este foi criado novo. O delta real (mark → mount
  // effects) é calculado AQUI no cliente usando a mark 'hero-render-start'
  // criada no topo do componente, e enviado como msSinceMark — o servidor só o
  // exibe. (Antes enviávamos ts=performance.now() e o endpoint fazia
  // Date.now()-ts, incorreto: performance.now() é relativo à navegação da página
  // e Date.now() é epoch — a subtração não representava tempo real nenhum.)
  useEffect(() => {
    const markName = 'hero-render-start';
    const markEntry =
      typeof performance !== 'undefined' ? performance.getEntriesByName(markName)[0] : undefined;
    const msSinceMark = markEntry
      ? Math.round(performance.now() - markEntry.startTime)
      : null;

    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(
        '/api/debug-log',
        JSON.stringify({
          tag: 'HeroSection',
          msg: 'mount effects complete',
          msSinceMark,
        }),
      );
    } else {
      fetch('/api/debug-log', {
        method: 'POST',
        body: JSON.stringify({
          tag: 'HeroSection',
          msg: 'mount effects complete',
          msSinceMark,
        }),
        keepalive: true,
      });
    }
  }, []);

  // ─── Scroll-driven parallax (rAF + direct DOM, replaces useScroll/useTransform) ───
  // UM único useEffect compartilhado: 1 listener scroll + 1 resize + 1 rAF,
  // progress calculado uma vez e reaplicado nas 3 escritas (scale, opacity, y).
  // Offset ['start start','end start'] → progress = clamp(-rect.top / rect.height, 0, 1).
  // Gate isMobile || reducedMotion → valores fixos (scale:1, opacity:1, y:0),
  // nenhum listener casado.
  useEffect(() => {
    const section = sectionRef.current;
    const bg = bgRef.current;
    const content = contentRef.current;
    if (!section || !bg || !content) return;

    if (isMobile || reducedMotion) {
      // Mesmo gate do código original: mobile/reduced-motion não animam.
      bg.style.transform = 'scale(1)';
      content.style.opacity = '1';
      content.style.transform = 'translateY(0px)';
      return;
    }

    const applyScroll = () => {
      heroRafRef.current = null; // self-clear do handle (gate p/ próximo schedule)
      // Batch de leitura ANTES da escrita (mesma disciplina do Navigation):
      const rect = section.getBoundingClientRect();
      // Offset 'start start'/'end start':
      // progress=0 quando rect.top=0 (topo da seção no topo do viewport),
      // progress=1 quando rect.top=-rect.height (bottom da seção no topo).
      const progress = Math.min(1, Math.max(0, -rect.top / rect.height));

      // 3 escritas, GPU-only (transform/opacity), reaproveitando o mesmo progress:
      // 1) backgroundScale = [0,1]→[1,1.1] linear. INVARIANTE: scale ≥ 1 sempre
      //    (1 + progress*0.1 ∈ [1, 1.1]) — nunca expõe bordas do full-bleed.
      bg.style.transform = `scale(${1 + progress * 0.1})`;
      // 2) contentOpacity = [0,0.8]→[1,0] piecewise-linear. Framer clampa em 0
      //    além de progress=0.8; replicamos com Math.max(0, ...):
      content.style.opacity = String(Math.min(1, Math.max(0, 1 - progress / 0.8)));
      // 3) contentY = [0,1]→[0,80] px linear.
      content.style.transform = `translateY(${progress * 80}px)`;
    };

    const scheduleScroll = () => {
      if (heroRafRef.current === null) {
        heroRafRef.current = requestAnimationFrame(applyScroll);
      }
    };

    // Estado inicial (Hero é above-the-fold; rect.top≈0 no mount → progress≈0):
    applyScroll();
    window.addEventListener('scroll', scheduleScroll, { passive: true });
    window.addEventListener('resize', scheduleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', scheduleScroll);
      window.removeEventListener('resize', scheduleScroll);
      if (heroRafRef.current !== null) cancelAnimationFrame(heroRafRef.current);
    };
  }, [isMobile, reducedMotion]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100svh] overflow-hidden bg-executive-black"
    >
      {/* ─── Layer 1: Background ─── */}
      <div ref={bgRef} className="absolute inset-0 z-0" style={{ transform: 'scale(1)' }}>
        <Image
          src="/images/hero/hero-image.png"
          // alt="" (vazio) é a prática correta de acessibilidade aqui: esta
          // imagem é puramente decorativa/de fundo — o conteúdo real (H1,
          // parágrafo) já está em texto real na página. Um alt descritivo
          // faria leitores de tela anunciarem a imagem redundantemente
          // antes do H1, atrapalhando quem navega por voz.
          alt=""
          fill
          priority
          // decoding="async": o Next/Image não define isso por padrão. Sinaliza
          // ao browser para NÃO bloquear a thread principal decodificando a
          // imagem durante o parse/first-paint — libera a thread para a
          // hidratação do React e o paint do <h1>/<p>. Combinado com o blur
          // placeholder já em tela, o custo visual é desprezível.
          decoding="async"
          placeholder="blur"
          blurDataURL={HERO_BLUR_DATA_URL}
          sizes="100vw"
          quality={isMobile ? 65 : 80}
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(145% 100% at 50% 75%, transparent 0%, rgba(17,17,17,0.4) 50%, rgba(17,17,17,0.95) 100%)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-executive-black via-executive-black/30 to-transparent" />
      </div>

      {/* ─── Layer 2: Atmospheric light leaks ─── */}
      <div className="hidden md:block absolute inset-0 z-[1] pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[36rem] h-[36rem] bg-gold-prestige/[0.04] rounded-full blur-[160px]" />
        <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-gold-prestige/[0.025] rounded-full blur-[140px]" />
        <div className="absolute top-1/2 left-0 w-[20rem] h-[20rem] bg-white/[0.015] rounded-full blur-[120px]" />
      </div>

      {/* ─── Layer 3: Content ─── */}
      <div
        ref={contentRef}
        className="relative z-10 min-h-[100svh] flex items-center"
        style={{ opacity: 1, transform: 'translateY(0px)' }}
      >
        <Container>
          {/* Entrada pura em CSS: o <h1>/<p> ficam visíveis IMEDIATAMENTE no
              primeiro paint, já no HTML do SSR — sem esperar hidratação do JS
              nem coreografia de variant (delayChildren/staggerChildren saíram
              junto com as variants do Framer do Hero). Toda a entrada visual
              residual é só a @keyframes .hero-content-rise (settle translateY
              12px→0, 480ms), injetada no <head> desde o SSR — não depende de
              hidratação do JS. */}
          <div className="hero-content-rise max-w-4xl">
            <h1
              className="
                text-[clamp(2.25rem,6vw,5rem)]
                font-cinzel
                font-light
                tracking-tight
                text-white
                leading-[1.04]
                max-w-5xl
              "
            >
              Prepare-se Para <span className="text-gold-prestige">Viver a Aviação</span>
            </h1>

            <div className="w-16 h-px bg-gold-prestige/40 my-8 sm:my-10" />

            <p
              className="
                text-base sm:text-lg lg:text-xl
                text-silver-mist
                leading-relaxed
                max-w-2xl
                font-montserrat
                font-light
              "
            >
              A Fly Crew não é apenas uma preparação.{' '}
              <span className="text-white/90">É uma experiência de transformação profissional</span>{' '}
              criada para quem deseja conquistar os céus com Elegância, Confiança e Presença.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-5 sm:gap-8 mt-10 sm:mt-12 lg:mt-14"
            >
              {/* <a href="#id"> em vez de <button onClick>: navegação para
                  âncora da própria página é semanticamente um link, não uma
                  ação de botão — mais correto para leitores de tela,
                  rastreadores de SEO (estrutura de links internos) e
                  permite "abrir em nova aba"/"copiar link" nativamente.
                  preventDefault + scrollTo mantém o offset customizado do
                  header fixo. */}
              <a
                href="#experience"
                onClick={(e) => scrollToSection(e, 'experience')}
                className="
                  w-full sm:w-auto
                  border border-gold-prestige
                  text-gold-prestige
                  hover:text-white hover:border-white/80
                  bg-transparent
                  px-10 py-4
                  text-xs sm:text-sm
                  tracking-[0.25em]
                  uppercase
                  font-semibold
                  transition-colors
                  duration-500
                  cursor-pointer
                  text-center
                  inline-block
                "
              >
                Conheça a Fly Crew
              </a>

              <a
                href="#contact"
                onClick={(e) => scrollToSection(e, 'contact')}
                className="
                  group
                  relative
                  w-full sm:w-auto
                  text-xs sm:text-sm
                  tracking-[0.25em]
                  uppercase
                  font-semibold
                  text-white/50
                  hover:text-white
                  transition-colors
                  duration-500
                  text-center sm:text-left
                  cursor-pointer
                  inline-block
                "
              >
                Quero Fazer Parte
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gold-prestige group-hover:w-full transition-all duration-700 ease-out" />
              </a>
            </div>
          </div>
        </Container>
      </div>

      {/* ─── Layer 4: Scroll cue ─── */}
      {/* Fade-in do scroll cue: .hero-cue-fade porta a @keyframes heroCueFade
          (delay 2.4s, duration 1s) injetada no <head> desde o SSR, espelhando o
          transition original do Framer (delay: reducedMotion?0:2.4, duration:
          reducedMotion?0.3:1). O guard de reduced-motion vive no @media
          (prefers-reduced-motion: reduce) dentro de HERO_CONTENT_RISE_CSS —
          mesma media query que o hook useReducedMotion lê, então OS-settings e
          estado React permanecem in sync; nenhum gate condicional aqui. */}
      <div className="absolute bottom-8 sm:bottom-10 lg:bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3 hero-cue-fade">
        <span className="text-[0.5rem] tracking-[0.4em] uppercase text-white/20 font-montserrat font-medium">
          Explorar
        </span>
        {/* Pulso infinito scaleY 1→0.3→1 (2.8s) via .hero-cue-pulse. CSS puro
            não detecta isMobile (useIsMobile usa matchMedia de width), então o
            gate isMobile||reducedMotion é replicado aqui condicionalmente: a
            classe só é aplicada quando !(isMobile || reducedMotion), exatamente
            como o animate original (isMobile||reducedMotion → scaleY:1 estático,
            sem pulso). reduced-motion também coberto por @media por defesa em
            profundidade. EASE_CINEMATIC (cubic-bezier(0.16,1,0.3,1)) já é o
            timing-function da @keyframes heroCuePulse. */}
        <div
          className={`w-px h-8 sm:h-10 bg-gradient-to-b from-gold-prestige/60 to-transparent origin-bottom${!(isMobile || reducedMotion) ? ' hero-cue-pulse' : ''}`}
        />
      </div>
    </section>
  );
}
