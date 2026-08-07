'use client';

import { useEffect } from 'react';

type NetworkInformationLike = {
  effectiveType?: string;
  downlink?: number;
};

type NavigatorLike = Navigator & {
  connection?: NetworkInformationLike;
  deviceMemory?: number;
};

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

// Diagnóstico global de runtime (best-effort): captura erros JS, rejeições
// não tratadas, falhas de carregamento de recurso, mudanças de visibilidade,
// ciclo de vida da página (bfcache via pageshow/pagehide), tipo de navegação
// e info de dispositivo/conexão. Sem render visual (return null). Lê apenas
// metadados técnicos do navegador/erro — nenhum dado de formulário, cookie
// ou input do usuário. Strings longas (stack, reason) são truncadas em 500.
export default function Diagnostics() {
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

    // Marcador 2 (primeiro useEffect): mede o delta entre a avaliação do
    // módulo (DIAGNOSTICS_MODULE_EVAL) e o primeira execução deste effect.
    // Como Diagnostics é dynamic({ ssr: false }), este delta reflete o tempo
    // para baixar+parsear+avaliar este chunk lazy após a hidratação inicial —
    // não o freeze inicial da landing (que ocorre antes deste chunk existir).
    // enviado uma vez no mount.
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
        send('DiagnosticsModuleTiming', 'first effect delta', {
          moduleEvalToFirstEffectMs: Math.round(m.duration),
          moduleEvalMsSinceNavStart,
        });
      } catch {
        // marker de início pode não existir se performance.mark falhou no
        // top-level (ambiente sem API) — ignora silenciosamente.
      }
    }

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

    // (f) Tipo de navegação (reload/navigate/back_forward) — uma vez no mount,
    // via Navigation Timing API.
    const navEntry = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (navEntry) {
      send('DiagnosticsNavigation', 'page load type', {
        type: navEntry.type,
        transferSize: navEntry.transferSize,
        domContentLoaded: Math.round(navEntry.domContentLoadedEventEnd),
        loadEventEnd: Math.round(navEntry.loadEventEnd),
      });
    }

    // (g) Info de conexão/dispositivo — best-effort (iOS Safari pode não expor
    // connection/deviceMemory).
    const nav = navigator as NavigatorLike;
    const conn = nav.connection;
    send('DiagnosticsDevice', 'device info', {
      effectiveType: conn?.effectiveType ?? null,
      downlink: conn?.downlink ?? null,
      deviceMemory: nav.deviceMemory ?? null,
      hardwareConcurrency: navigator.hardwareConcurrency ?? null,
      userAgent: navigator.userAgent,
    });

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
            send('DiagnosticsLongTask', 'main thread blocked', {
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

    return () => {
      window.removeEventListener('error', handleJsError);
      window.removeEventListener('error', handleResourceError, true);
      window.removeEventListener('unhandledrejection', handleRejection);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handlePageHide);
      if (longTaskObserver) longTaskObserver.disconnect();
    };
  }, []);

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

  return null;
}
