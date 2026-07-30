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

    return () => {
      window.removeEventListener('error', handleJsError);
      window.removeEventListener('error', handleResourceError, true);
      window.removeEventListener('unhandledrejection', handleRejection);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  return null;
}
