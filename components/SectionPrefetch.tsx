'use client';

import { useEffect } from 'react';
import { getImageProps } from 'next/image';
import { queueDebugLog } from '@/lib/debug-log-batch';

/**
 * SectionPrefetch — aquecedor de cache best-effort para os 9 chunks de seção
 * lazy (ssr:false) da landing. Pré-carrega o código de cada seção em segundo
 * plano, *depois* da hidratação inicial e *somente* em tempo ocioso da thread
 * principal, para que quando o usuário rolar até a seção o chunk já esteja no
 * cache HTTP do navegador — convertendo "buscar da rede + esperar" em
 * "já está aqui". Resolve o sintoma "tela preta + botões travados na primeira
 * rolagem em cache frio" (HTML do servidor só emite o skeleton estático dos
 * wrappers dynamic(ssr:false) até o chunk real chegar da rede).
 *
 * Timing: SectionPrefetch é importado estaticamente por ClientWidgets.tsx (que
 * também é estático no layout). Logo seu useEffect dispara no mount/hidratação
 * do bundle client — DEPOIS do LCP/hidratação do Hero. requestIdleCallback (ou
 * o fallback setTimeout no Safari) só dispara DEPOIS disso, em tempo ocioso.
 * Não afeta LCP, hidratação do Hero nem INP inicial.
 *
 * Por que import estático (não dynamic/srr:false): se SectionPrefetch fosse
 * lazy, ele mesmo atrasaria o próprio gatilho. O custo extra no First Load JS
 * é desprezível (~40 linhas; os 9 import() são dinâmicos, só criam referências
 * de chunk — não puxam framer-motion/embla/sonner para o bundle inicial).
 *
 * Dedup de chunks: cada import() aqui usa o MESMO specifier literal que o
 * wrapper dynamic() de cada *SectionClient.tsx. webpack/turbopack deduplica
 * por path de módulo resolvido, então reutiliza exatamente os mesmos chunks já
 * mapeados — sem criar chunks duplicados. NÃO usar array + import(variável):
 * quebra a análise estática de chunks e cria context-module.
 *
 * Guardas: respeita Data Saver (saveData) e conexões muito lentas (slow-2g/
 * 2g). iOS Safari não expõe navigator.connection, então conn é undefined e os
 * guardas são pulados (não bloqueiam — correto, já que não há sinal de poupar
 * dados nessas plataformas).
 *
 * Safari/iOS: NÃO implementa requestIdleCallback nativamente (incluindo
 * iPhone 13 Pro Max e iPhone 16 / iOS 18 testados). 'requestIdleCallback' in
 * window === false nessas plataformas → cai no fallback setTimeout(1500ms),
 * que é o caminho REAL de execução nos testes em dispositivo Apple.
 */
type EffectiveType = 'slow-2g' | '2g' | '3g' | '4g';

type NetworkInformationLike = {
  effectiveType?: EffectiveType;
  saveData?: boolean;
};

type NavigatorLike = Navigator & {
  connection?: NetworkInformationLike;
};

// window com requestIdleCallback/cancelIdleCallback opcionais. lib.dom declara
// esses membros em Window, então `typeof === 'function'` ou `in window` puros
// são sempre-verdadeiros em TS e afunilam o ramo de fallback para `never`,
// mascarando exatamente o caminho que roda no Safari/iOS (que não implementa
// requestIdleCallback). Cast via `as unknown as` restaura o ramo falso real.
type IdleCapableWindow = {
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions,
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
  setTimeout: (handler: TimerHandler, timeout?: number) => number;
  clearTimeout: (handle?: number) => void;
};

export default function SectionPrefetch() {
  useEffect(() => {
    // Telemetria best-effort (mesmo padrão de beacon do Diagnostics.tsx: POST
    // /api/debug-log via sendBeacon, fallback fetch keepalive). Nunca bloqueia
    // o dispatch — falha de telemetria não é falha de prefetch. Todos os
    // valores enviados são literais curtas controladas (tags, slugs de seção,
    // enums, números) — nada de user input, nada que precise de truncamento.
    // Todos os beacons do SectionPrefetch (dispatch scheduled / prefetch
    // started / chunk loaded|failed / dispatch aborted) vão pelo lote único
    // de lib/debug-log-batch.ts — 1 POST batched no lugar de ~11 individuais,
    // fora da janela crítica de boot. Nunca bloqueia o dispatch: falha de
    // telemetria não é falha de prefetch. (send vira um adapter fino sobre
    // queueDebugLog; os call-sites `send('SectionPrefetch', ...)` ficam
    // inalterados — só o corpo desta função muda.)
    const send = (
      tag: string,
      msg: string,
      extra?: Record<string, unknown>,
    ) => {
      const entry: {
        tag: string;
        msg: string;
        extra?: Record<string, unknown>;
      } = { tag, msg };
      if (extra) entry.extra = extra;
      queueDebugLog(entry);
    };

    const nav = navigator as NavigatorLike;
    const conn = nav.connection;
    const mountPerf = performance.now();

    // Respeita Data Saver e conexões muito lentas: o usuário sinalizou querer
    // economizar dados/largura — não prefetcha. iOS Safari não expõe
    // connection (conn === undefined), então os guardas são pulados — não
    // bloqueiam o prefetch, que é o comportamento desejado sem sinal de save.
    // Telemetria (b): quando um guard aborta, reporta o motivo e confirma
    // networkInfoAvailable (boolean) — Safari fica undefined → never aborta.
    if (conn?.saveData) {
      send('SectionPrefetch', 'dispatch aborted', {
        reason: 'saveData',
        networkInfoAvailable: !!conn,
        saveData: true,
        effectiveType: conn.effectiveType ?? null,
      });
      return;
    }
    if (
      conn?.effectiveType &&
      (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g')
    ) {
      send('SectionPrefetch', 'dispatch aborted', {
        reason: 'slowConnection',
        networkInfoAvailable: !!conn,
        saveData: conn.saveData ?? null,
        effectiveType: conn.effectiveType,
      });
      return;
    }

    // Fire-and-forget: só popula o cache de módulo/HTTP do navegador. Não usa
    // o resultado, não afeta render. a seção reimporta o chunk ao renderizar,
    // e é esse o caminho autoritativo (e visível) de erro.
    // Ordem = ordem de scroll (app/page.tsx): Manifesto → Experience → …
    //
    // trackImport envolve cada import() literal com telemetria (d): captura
    // sucesso/falha individual + Duration via Date.now() antes/depois. O
    // specifier CONTINUA literal (passar o promise a uma função NÃO quebra a
    // análise estática de chunks do webpack — é o mesmo padrão de
    // dynamic(() => import('...')) dos wrappers *SectionClient). NÃO usar
    // array + import(variável): quebraria a análise estática e criaria
    // context-module. Rejeição individual é tratada no onRejected (mesma
    // semântica do .catch(() => {}) original — não vira unhandledrejection).
    const trackImport = (section: string, p: Promise<unknown>) => {
      const start = Date.now();
      void p.then(
        () =>
          send('SectionPrefetch', 'chunk loaded', {
            section,
            ms: Date.now() - start,
          }),
        () =>
          send('SectionPrefetch', 'chunk failed', {
            section,
            ms: Date.now() - start,
          }),
      );
    };

    const prefetch = () => {
      // Telemetria (c): prefetch de fato começou a rodar — delta relativo ao
      // mount. No Safari (fallback setTimeout) chega ~1500ms após o mount; no
      // Chrome (requestIdleCallback) depende do tempo ocioso. Se nunca chega,
      // temos a prova de que o dispatch não completou — exatamente o que
      // queremos confirmar no cenário cache-frio do iOS Safari.
      send('SectionPrefetch', 'prefetch started', {
        msSinceMount: Math.round(performance.now() - mountPerf),
        networkInfoAvailable: !!conn,
      });
      trackImport('manifesto', import('@/components/landing/ManifestoSection'));
      trackImport('experience', import('@/components/landing/ExperienceSection'));
      trackImport('founders', import('@/components/landing/FoundersSection'));
      trackImport('transformation', import('@/components/landing/TransformationSection'));
      trackImport('workshops', import('@/components/landing/WorkshopsSection'));
      trackImport('gallery', import('@/components/landing/GallerySection'));
      trackImport('testimonials', import('@/components/landing/TestimonialsSection'));
      trackImport('community', import('@/components/landing/CommunitySection'));
      trackImport('finalCta', import('@/components/landing/FinalCTASection'));

      // Aquece o cache de borda da Vercel para as imagens "hero" LOCAIS das
      // seções lazy (Founders ×2, Manifesto, FinalCTA). Os trackImport acima só
      // carregam o JS do chunk — NÃO montam o componente, então NÃO disparam a
      // busca da imagem. Pré-buscamos a imagem explicitamente para que, ao
      // montar a seção no scroll, a combinação imagem+largura+qualidade já
      // esteja no cache de borda (HIT) em vez de sob demanda (MISS = trava
      // relatado). Gallery/Workshops/Testimonials usam Cloudinary (carrossel,
      // muitas imagens) e já têm preconnect em app/page.tsx — não pré-aquecem
      // aqui (contraproducente).
      //
      // URL byte-exata via getImageProps (mesma API do next/image que gera o
      // srcset real do <Image>): a URL aquecida bate exatamente com a que o
      // navegador pedirá ao montar. quality:75 = default de todos os <Image>
      // destas 4 seções (nenhum seta quality explícita).
      //
      // Viewport-aware + throttled: em vez de aquecer o srcset CHEIO de cada
      // imagem (~7 larguras × 4 imgs ≈ 28-33 fetches num loop apertado, sem
      // noção do dispositivo), avaliamos o <img sizes> no viewport REAL
      // (window.innerWidth via window.matchMedia) e aquecemos só a 1-2
      // largura(s) do srcset mais próxima(s) da que o navegador realmente
      // pedirá: a imediatamente acima (menor w ≥ largura de exibição — spec
      // srcset usa densidade ≥ 1, sem multiplicar DPR) + a imediatamente
      // abaixo como buffer de erro de sourceSize. ~4-8 fetches no total. Os
      // disparos são espaçados (setTimeout escalonado de 60ms) p/ não competir
      // pela mesma janela de rede/decode. deviceSizes default (next.config não
      // sobrescreve); pulamos 3840 (4K).
      const THROTTLE_MS = 60;
      const warmQueue: { section: string; url: string }[] = [];

      // Resolve o <img sizes> no viewport real → largura de exibição em CSS px
      // que o navegador usará p/ selecionar do srcset. Top-level split por
      // vírgula (ignora vírgulas dentro de (...) das media conditions); cada
      // entrada = "<media-condition>? <length>". Resolução cobre vw/px (as 4
      // seções usam vw); fallback = largura total do viewport.
      const displayWidthFor = (sizes: string): number => {
        const vw = window.innerWidth;
        const parts: string[] = [];
        let depth = 0;
        let cur = '';
        for (const ch of sizes.trim()) {
          if (ch === '(') { depth++; cur += ch; }
          else if (ch === ')') { depth--; cur += ch; }
          else if (ch === ',' && depth === 0) { parts.push(cur); cur = ''; }
          else cur += ch;
        }
        if (cur.trim()) parts.push(cur);
        const toPx = (len: string): number => {
          const m = /^(\d+(?:\.\d+)?)(vw|px|rem|em|%)?$/.exec(len.trim());
          if (!m) return vw;
          const val = Number(m[1]);
          switch (m[2] ?? 'vw') {
            case 'vw': case '%': return (val / 100) * vw;
            case 'px': return val;
            case 'rem': case 'em': return val * 16;
            default: return vw;
          }
        };
        for (const entry of parts) {
          const tokens = entry.trim().split(/\s+/);
          const len = tokens[tokens.length - 1];
          const cond = tokens.slice(0, -1).join(' ');
          if (!cond || window.matchMedia(cond).matches) return toPx(len);
        }
        return vw;
      };

      const warmImage = (section: string, src: string, sizes: string): number => {
        try {
          const { props } = getImageProps({
            src,
            alt: '',
            fill: true,
            sizes,
            quality: 75,
          });
          const srcSet = (props as { srcSet?: string }).srcSet ?? '';
          // srcSet = "url1 640w, url2 750w, ..." — url NÃO contém spaces/vírgulas
          // (encodeURIComponent em /_next/image garante), então split(',') +
          // split(/\s+/) separa url do descriptor "Nw".
          const candidates = srcSet
            .split(',')
            .map((entry) => {
              const [url, descriptor] = entry.trim().split(/\s+/);
              const wMatch = descriptor?.match(/(\d+)w$/);
              return { url, w: wMatch ? Number(wMatch[1]) : 0 };
            })
            .filter((e) => e.url && e.w > 0 && e.w !== 3840)
            .sort((a, b) => a.w - b.w);
          if (candidates.length === 0) return 0;
          // Viewport-aware: o navegador seleciona do srcset a MENOR largura ≥
          // largura de exibição (densidade ≥ 1, sem multiplicar DPR) — aquecemos
          // essa + a imediatamente abaixo (buffer de erro de sourceSize).
          const target = displayWidthFor(sizes);
          const aboveIdx = candidates.findIndex((c) => c.w >= target);
          const picks: { url: string; w: number }[] = [];
          if (aboveIdx === -1) {
            picks.push(candidates[candidates.length - 1]);
          } else {
            picks.push(candidates[aboveIdx]);
            if (aboveIdx > 0) picks.push(candidates[aboveIdx - 1]);
          }
          for (const p of picks) warmQueue.push({ section, url: p.url });
          return picks.length;
        } catch {
          return 0; // best-effort: warm falha silencioso — não derruba o prefetch de JS.
        }
      };

      let totalWarmed = 0;
      totalWarmed += warmImage('founders-nathalie', '/images/founders/nathalie.jpeg', '(max-width: 768px) 100vw, 33vw');
      totalWarmed += warmImage('founders-thais', '/images/founders/thais.jpeg', '(max-width: 768px) 100vw, 33vw');
      totalWarmed += warmImage('manifesto', '/images/manifesto/manifesto-image.png', '(max-width: 768px) 100vw, 50vw');
      totalWarmed += warmImage('finalCta', '/images/finalCTA/final-cta-image.png', '100vw');

      send('SectionPrefetch', 'image warm scheduled', { images: totalWarmed });

      // Throttle: espaça os fetches p/ não competir por rede/decode de uma vez.
      warmQueue.forEach((item, i) => {
        setTimeout(() => {
          const img = new Image();
          img.onerror = () =>
            send('SectionPrefetch', 'image warm failed', { section: item.section, url: item.url });
          img.src = item.url;
        }, i * THROTTLE_MS);
      });
    };

    // requestIdleCallback não existe no Safari/iOS — o fallback setTimeout é o
    // caminho real de execução nesses dispositivos. Cast para IdleCapableWindow
    // porque lib.dom declara requestIdleCallback em Window, o que tornaria o
    // guard `typeof === 'function'` sempre-verdadeiro em TS e afunilaria este
    // ramo de fallback para `never`.
    const w = window as unknown as IdleCapableWindow;
    if (typeof w.requestIdleCallback === 'function') {
      // Telemetria (a): dispatch scheduled via requestIdleCallback.
      send('SectionPrefetch', 'dispatch scheduled', {
        dispatch: 'requestIdleCallback',
        networkInfoAvailable: !!conn,
      });
      const id = w.requestIdleCallback(prefetch, { timeout: 3000 });
      return () => {
        if (typeof w.cancelIdleCallback === 'function') {
          w.cancelIdleCallback(id);
        }
      };
    }

    // Telemetria (a): dispatch scheduled via setTimeout fallback (Safari/iOS).
    send('SectionPrefetch', 'dispatch scheduled', {
      dispatch: 'setTimeout',
      networkInfoAvailable: !!conn,
    });
    const timerId = w.setTimeout(prefetch, 1500);
    return () => w.clearTimeout(timerId);
  }, []);

  return null;
}
