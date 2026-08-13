'use client';

// ============================================================================
// ⚠️ VERSÃO DE TESTE DE ISOLAMENTO (BISSEÇÃO) — TEMPORÁRIA, NÃO É A FINAL ⚠️
//
// Esta NÃO é a versão final do Diagnostics.tsx. É uma versão de teste radical
// criada para a bisseção do congelamento de boot: mantém APENAS o heartbeat da
// thread principal (setInterval 250ms + beacon de gap) para verificar se o
// próprio Diagnostics.tsx — que cresceu bastante ao longo desta investigação
// (interceptador de console, múltiplos PerformanceObserver, listeners de
// navigation/device/visibility/lifecycle) — não é ele mesmo um contribuinte
// para o freeze que ele mesmo mede.
//
// Tudo o mais foi COMENTADO (preservado no código para fácil reversão):
//   - Interceptador de console.error/warn (mismatch de hidratação)
//   - PerformanceObserver de longtask
//   - DiagnosticsModuleTiming (marcadores perf.mark/measure top-level)
//   - DiagnosticsNavigation (Navigation Timing API)
//   - DiagnosticsDevice (info de conexão/dispositivo)
//   - DiagnosticsVisibility (visibilitychange)
//   - DiagnosticsLifecycle (pageshow/pagehide)
//   - Listeners de error / unhandledrejection / resource-error
//   - Helper send() (beacon imediato) — usado só pelos listeners desativados
//
// Reverter: `git checkout components/Diagnostics.tsx` (branch de teste).
// ============================================================================

import { useEffect } from 'react';
import { queueDebugLog, type DebugLogEntry } from '@/lib/debug-log-batch';

// (Tipos auxiliares do DiagnosticsDevice — desativados nesta bisseção)
/*
type NetworkInformationLike = {
  effectiveType?: string;
  downlink?: number;
};

type NavigatorLike = Navigator & {
  connection?: NetworkInformationLike;
  deviceMemory?: number;
};
*/

// (Marcadores top-level de module-eval / DiagnosticsModuleTiming — desativados)
/*
// Marcador 1 (top-level do módulo): selado quando o JS deste chunk do
// Diagnostics começa a ser avaliado (parse/eval do módulo). Diagnostics é
// importado via dynamic({ ssr: false }) em ClientWidgets.tsx, então este
// código roda DEPOIS da hidratação inicial do bundle client e depois do
// chunk lazy baixar — captura "o JS do chunk começou a executar", não o
// instante do freeze inicial da landing (que ocorre antes deste chunk).
const DIAGNOSTICS_MODULE_EVAL = 'diagnostics-module-eval';
const DIAGNOSTICS_FIRST_EFFECT = 'diagnostics-first-effect';
// Capturado junto com o marcador 1 (top-level do módulo): ms desde
// navigationStart no instante em que este chunk começou a avaliar. Lido
// no beacon DiagnosticsModuleTiming (Marcador 2) como referência absoluta.
const moduleEvalMsSinceNavStart =
  typeof performance !== 'undefined' ? Math.round(performance.now()) : null;
if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
  performance.mark(DIAGNOSTICS_MODULE_EVAL);
}
*/

// Diagnóstico global de runtime (best-effort). NESTA VERSÃO DE TESTE de
// isolamento: sem render visual (return null), mantém APENAS o heartbeat.
export default function Diagnostics() {
  useEffect(() => {
    // Adapter para beacons BATCHED: o heartbeat enfileira no lote único de
    // lib/debug-log-batch.ts em vez de disparar POST imediato.
    const sendBatched = (
      tag: string,
      msg: string,
      extra?: Record<string, unknown>,
    ) => {
      const entry: DebugLogEntry = { tag, msg };
      if (extra) entry.extra = extra;
      queueDebugLog(entry);
    };

    // (Helper send() — beacon imediato — desativado nesta bisseção)
    /*
    const send = (
      tag: string,
      msg: string,
      extra?: Record<string, unknown>,
    ) => {
      const payload: {
        tag: string;
        msg: string;
        extra?: Record<string, unknown>;
      } = { tag, msg };
      if (extra) payload.extra = extra;
      const bodyStr = JSON.stringify(payload);
      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.sendBeacon === 'function'
      ) {
        navigator.sendBeacon('/api/debug-log', bodyStr);
      } else {
        fetch('/api/debug-log', {
          method: 'POST',
          body: bodyStr,
          keepalive: true,
        });
      }
    };
    */

    // (DiagnosticsModuleTiming — Marcador 2 — desativado nesta bisseção)
    /*
    if (
      typeof performance !== 'undefined' &&
      typeof performance.mark === 'function' &&
      typeof performance.measure === 'function'
    ) {
      performance.mark(DIAGNOSTICS_FIRST_EFFECT);
      try {
        const m = performance.measure(
          'diagnostics module-eval → first-effect',
          DIAGNOSTICS_MODULE_EVAL,
          DIAGNOSTICS_FIRST_EFFECT,
        );
        sendBatched('DiagnosticsModuleTiming', 'first effect delta', {
          moduleEvalToFirstEffectMs: Math.round(m.duration),
          moduleEvalMsSinceNavStart,
        });
      } catch {
        // marker de início pode não existir se performance.mark falhou no
        // top-level (ambiente sem API) — ignora silenciosamente.
      }
    }
    */

    // (i) Heartbeat da thread principal — setInterval a cada 250ms, iniciado
    // o mais cedo possível no mount. Cada tick mede o delta desde o tick
    // anterior; se delta > 1000ms (4x o esperado), a thread esteve bloqueada
    // nesse intervalo. Comparado com os beacons de setTimeout do
    // SectionPrefetch, isto distingue thread parada (heartbeat também atrasa)
    // de algo isolado ao timer do prefetch (heartbeat permanece normal). Um
    // beacon no tick 1 confirma quando o heartbeat começou (timestamp
    // absoluto, performance.now()).
    // Auto-desliga após ~20s (80 ticks a 250ms): tempo suficiente para
    // capturar o freeze de boot que estamos investigando, sem manter o
    // intervalo rodando (e gerando beacons de gap) pelo resto da sessão.
    const HEARTBEAT_MAX_TICKS = 80;
    const heartbeatState = { lastTick: performance.now(), count: 0 };
    const heartbeatId = setInterval(() => {
      const now = performance.now();
      const delta = now - heartbeatState.lastTick;
      heartbeatState.lastTick = now;
      heartbeatState.count += 1;
      if (heartbeatState.count === 1) {
        sendBatched('DiagnosticsHeartbeat', 'heartbeat started', {
          startedAtMs: Math.round(now),
          tickNumber: heartbeatState.count,
        });
      }
      if (delta > 1000) {
        sendBatched('DiagnosticsHeartbeat', 'gap detected', {
          expectedMs: 250,
          actualDeltaMs: Math.round(delta),
          tickNumber: heartbeatState.count,
        });
      }
      if (heartbeatState.count >= HEARTBEAT_MAX_TICKS) {
        clearInterval(heartbeatId);
      }
    }, 250);

    // (Listeners de erro / ciclo-de-vida / visibilidade — desativados nesta bisseção)
    /*
    // (a) Erros JS não capturados (fase de bubble).
    const handleJsError = (e: ErrorEvent) => {
      send('DiagnosticsError', 'js error', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        stack: e.error?.stack?.slice(0, 500),
      });
    };

    // (c) Falhas de carregamento de recurso (img/script/link) — não borbulham,
    // então capturamos na fase de capture.
    const handleResourceError = (e: ErrorEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        target !== (window as unknown as EventTarget) &&
        'tagName' in target
      ) {
        send('DiagnosticsError', 'resource load failed', {
          tag: target.tagName,
          src:
            (target as HTMLImageElement).src ||
            (target as HTMLScriptElement).src ||
            (target as HTMLLinkElement).href ||
            null,
        });
      }
    };

    // (b) Promises rejeitadas sem catch.
    const handleRejection = (e: PromiseRejectionEvent) => {
      send('DiagnosticsError', 'unhandled rejection', {
        reason: String(e.reason).slice(0, 500),
      });
    };

    // (d) Mudança de visibilidade (background/foreground) com timestamp.
    const handleVisibility = () => {
      send('DiagnosticsVisibility', document.visibilityState, {
        ts: performance.now(),
      });
    };

    // (e) Ciclo de vida da página — persisted:true indica restauração via
    // bfcache (não é reload do servidor).
    const handlePageShow = (e: PageTransitionEvent) => {
      send('DiagnosticsLifecycle', 'pageshow', {
        persisted: e.persisted,
      });
    };
    const handlePageHide = (e: PageTransitionEvent) => {
      send('DiagnosticsLifecycle', 'pagehide', {
        persisted: e.persisted,
      });
    };

    window.addEventListener('error', handleJsError);
    window.addEventListener('error', handleResourceError, true);
    window.addEventListener('unhandledrejection', handleRejection);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('pagehide', handlePageHide);
    */

    // (DiagnosticsNavigation — Navigation Timing — desativado nesta bisseção)
    /*
    const navEntry = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (navEntry) {
      sendBatched('DiagnosticsNavigation', 'page load type', {
        type: navEntry.type,
        transferSize: navEntry.transferSize,
        domContentLoaded: Math.round(navEntry.domContentLoadedEventEnd),
        loadEventEnd: Math.round(navEntry.loadEventEnd),
      });
    }
    */

    // (DiagnosticsDevice — info de conexão/dispositivo — desativado nesta bisseção)
    /*
    const nav = navigator as NavigatorLike;
    const conn = nav.connection;
    sendBatched('DiagnosticsDevice', 'device info', {
      effectiveType: conn?.effectiveType ?? null,
      downlink: conn?.downlink ?? null,
      deviceMemory: nav.deviceMemory ?? null,
      hardwareConcurrency: navigator.hardwareConcurrency ?? null,
      userAgent: navigator.userAgent,
    });
    */

    // (PerformanceObserver de longtask — desativado nesta bisseção)
    /*
    // (h) Long tasks — tarefas que bloqueiam a thread principal por >50ms.
    // PerformanceObserver expõe isso sem precisar de Mac/Web Inspector; revela
    // se/ quando a thread trava no cenário de cache frio em navegação NOVA e
    // por quanto tempo. NOTA: 'longtask' é família Chromium; em WebKit (iOS
    // Safari) observe() pode lançar e cair no catch silencioso — nesse caso a
    // telemetria do SectionPrefetch (beacons de setTimeout) permanece o sinal
    // primário para iOS; este observer cobre Android/Chrome/desktop.
    let longTaskObserver: PerformanceObserver | undefined;
    if ('PerformanceObserver' in window) {
      try {
        longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            sendBatched('DiagnosticsLongTask', 'main thread blocked', {
              duration: Math.round(entry.duration),
              startTime: Math.round(entry.startTime),
              name: entry.name,
            });
          }
        });
        longTaskObserver.observe({ type: 'longtask', buffered: true });
      } catch {
        // 'longtask' pode não ser suportado (WebKit/Firefox antigos) — ignora.
      }
    }
    */

    return () => {
      // Cleanup (versão de teste): apenas o heartbeat precisa ser limpo.
      // Os listeners/observers originais estão desativados (comentados).
      clearInterval(heartbeatId);
    };
  }, []);

  // (Interceptador de console.error/warn — mismatch de hidratação — desativado nesta bisseção)
  /*
  // Interceptor de console.error/warn (mismatch de hidratação): o React
  // emite "Hydration failed because the server rendered HTML didn't match
  // the client." e "Text content does not match server-rendered HTML." via
  // console.error (não via window 'error' — não borbulha como ErrorEvent),
  // então o listener (a) acima não os captura. Um re-render de hidratação
  // forçado é caro e suspeito de contribuir com o freeze de 4-15s no cache
  // frio do iPhone. Reporta qualquer chamada contendo "hydrat" ou
  // "did not match" (case-insensitive). Restaura os originais no cleanup
  // para não vazar em navegação SPA. Tem seu próprio send (cópia local do
  // helper de beacon) para NÃO alterar o useEffect existente acima
  // ("só adicione"), cujos listeners estão congelados por contrato.
  useEffect(() => {
    const send = (
      tag: string,
      msg: string,
      extra?: Record<string, unknown>,
    ) => {
      const payload: {
        tag: string;
        msg: string;
        extra?: Record<string, unknown>;
      } = { tag, msg };
      if (extra) payload.extra = extra;
      const bodyStr = JSON.stringify(payload);
      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.sendBeacon === 'function'
      ) {
        navigator.sendBeacon('/api/debug-log', bodyStr);
      } else {
        fetch('/api/debug-log', {
          method: 'POST',
          body: bodyStr,
          keepalive: true,
        });
      }
    };

    const originalError = console.error;
    const originalWarn = console.warn;

    const checkAndReport = (args: unknown[], level: string) => {
      const text = args.map((a) => String(a)).join(' ');
      if (/hydrat/i.test(text) || /did not match/i.test(text)) {
        send('DiagnosticsHydration', 'mismatch detected', {
          level,
          message: text.slice(0, 500),
        });
      }
    };

    console.error = (...args: unknown[]) => {
      checkAndReport(args, 'error');
      originalError.apply(console, args);
    };
    console.warn = (...args: unknown[]) => {
      checkAndReport(args, 'warn');
      originalWarn.apply(console, args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);
  */

  return null;
}
