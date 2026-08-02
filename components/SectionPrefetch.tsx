'use client';

import { useEffect } from 'react';

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
    const nav = navigator as NavigatorLike;
    const conn = nav.connection;

    // Respeita Data Saver e conexões muito lentas: o usuário sinalizou querer
    // economizar dados/largura — não prefetcha. iOS Safari não expõe
    // connection (conn === undefined), então os guardas são pulados — não
    // bloqueiam o prefetch, que é o comportamento desejado sem sinal de save.
    if (conn?.saveData) return;
    if (
      conn?.effectiveType &&
      (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g')
    ) {
      return;
    }

    // Fire-and-forget: só popula o cache de módulo/HTTP do navegador. Não usa
    // o resultado, não afeta render. .catch silencia rejeição best-effort —
    // falha de prefetch não é erro de usuário: a seção reimporta o chunk ao
    // renderizar, e é esse o caminho autoritativo (e visível) de erro.
    // Ordem = ordem de scroll (app/page.tsx): Manifesto → Experience → …
    const prefetch = () => {
      void import('@/components/landing/ManifestoSection').catch(() => {});
      void import('@/components/landing/ExperienceSection').catch(() => {});
      void import('@/components/landing/FoundersSection').catch(() => {});
      void import('@/components/landing/TransformationSection').catch(() => {});
      void import('@/components/landing/WorkshopsSection').catch(() => {});
      void import('@/components/landing/GallerySection').catch(() => {});
      void import('@/components/landing/TestimonialsSection').catch(() => {});
      void import('@/components/landing/CommunitySection').catch(() => {});
      void import('@/components/landing/FinalCTASection').catch(() => {});
    };

    // requestIdleCallback não existe no Safari/iOS — o fallback setTimeout é o
    // caminho real de execução nesses dispositivos. Cast para IdleCapableWindow
    // porque lib.dom declara requestIdleCallback em Window, o que tornaria o
    // guard `typeof === 'function'` sempre-verdadeiro em TS e afunilaria este
    // ramo de fallback para `never`.
    const w = window as unknown as IdleCapableWindow;
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(prefetch, { timeout: 3000 });
      return () => {
        if (typeof w.cancelIdleCallback === 'function') {
          w.cancelIdleCallback(id);
        }
      };
    }

    const timerId = w.setTimeout(prefetch, 1500);
    return () => w.clearTimeout(timerId);
  }, []);

  return null;
}
