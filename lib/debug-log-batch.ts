// Fila best-effort que CONSOLIDA os beacons de telemetria de boot num único
// POST /api/debug-log, em vez de N requisições separadas competindo pelo pool
// limitado de conexões HTTP/1.1 no mesmo instante de carregamento — apontado
// como causa do freeze de 4-12s em cache frio no iOS Safari (DevTools: bloco
// de beacons "mount effects complete" + prefetch de rota disputando conexões
// com a imagem revalidada e o JS da landing, tudo na mesma janela crítica).
//
// ESCOPO: usada APENAS pelos beacons "mount effects complete" (um por seção da
// landing, ~15 no total). O heartbeat do Diagnostics.tsx (gap >1000ms) e os
// beacons operacionais (erros, lifecycle, SectionPrefetch) seguem imediatos
// pelo send individual — são diagnósticos de evento, não batch de mount, e o
// heartbeat foi explicitamente mantido (diagnóstico essencial).
//
// Mecânica: array singleton a nível de módulo (ES module singleton — mesmo
// estado compartilhado entre todos os importadores) + debounce de 200ms.
// Cada queueDebugLog() empurra a entrada e (re)agenda o flush; 200ms após o
// ÚLTIMO mount, um único POST envia o array inteiro (1 requisição no lugar de
// ~15). drena no pagehide para não perder o lote pendente numa navegação
// rápida — sem isto, a fila ainda dentro do debounce seria descartada no unload.

type DebugLogEntry = {
  tag: string;
  msg: string;
  msSinceMark?: number | null;
  extra?: Record<string, unknown>;
};

const ENDPOINT = '/api/debug-log';
const FLUSH_DEBOUNCE_MS = 200;

let queue: DebugLogEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let unloadGuarded = false;

const flush = (): void => {
  flushTimer = null;
  const batch = queue;
  queue = [];
  if (batch.length === 0) return;
  const body = JSON.stringify(batch);
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(ENDPOINT, body);
      return;
    }
    if (typeof fetch === 'function') {
      void fetch(ENDPOINT, { method: 'POST', body, keepalive: true });
    }
  } catch {
    // best-effort: telemetria nunca deve quebrar a página.
  }
};

const guardUnload = (): void => {
  if (unloadGuarded || typeof window === 'undefined') return;
  unloadGuarded = true;
  // Drena a fila no unload — sem isto, um lote ainda dentro do debounce de
  // 200ms seria perdido numa navegação/unload rápido entre o último mount e o
  // flush agendado. useCapture=false basta (pagehide não tem fase de capture
  // significativa aqui); o listener vive pelo lifetime da página.
  window.addEventListener('pagehide', flush);
};

export function queueDebugLog(entry: DebugLogEntry): void {
  queue.push(entry);
  guardUnload();
  if (flushTimer !== null) clearTimeout(flushTimer);
  // Debounce: 200ms depois do ÚLTIMO mount — aguarda as seções pararem de
  // montar antes de despachar, maximizando a consolidação num único POST.
  flushTimer = setTimeout(flush, FLUSH_DEBOUNCE_MS);
}
