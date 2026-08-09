// Fila best-effort que CONSOLIDA os beacons de telemetria num único POST
// /api/debug-log, em vez de N requisições separadas competindo pelo pool
// limitado de conexões HTTP/1.1 no mesmo instante de carregamento — apontado
// (evidência dupla: network waterfall com dezenas de debug-log "pending"
// ao lado do fetch de testimonials, e log de 841 entradas onde 668/79% são
// nossos próprios beacons) como a causa do esgotamento de pool que trava as
// requisições que o site realmente precisa (testimonials, prefetch de rota).
//
// ESCOPO: beacons "mount effects complete" (15 seções) + beacons de boot do
// Diagnostics (ModuleTiming, Navigation, Device, Heartbeat) + beacons do
// SectionPrefetch (dispatch scheduled / prefetch started / chunk loaded|failed)
// + LongTask (firehose — cada tarefa >50ms gerava 1 beacon individual).
// Todos enfileirados e despachados em um único POST batched após debounce de
// 300ms (ou no evento 'load' da window, o que vier primeiro).
//
// Beacons de evento RAROS e críticos (erros JS, rejeições, resource load
// failed, visibility, lifecycle pageshow/pagehide, hydration mismatch) seguem
// imediatos pelo send individual no próprio Diagnostics.tsx — volume de
// unidades por sessão, não competem no boot, e pagehide precisa de envio
// confiável no unload (sendBeacon imediato é mais seguro que um debounce
// que pode não drenar a tempo).
//
// Mecânica: array singleton a nível de módulo (ES module singleton — mesmo
// estado compartilhado entre todos os importadores) + debounce de 300ms.
// Cada queueDebugLog() empurra a entrada e (re)agenda o flush; 300ms após o
// ÚLTIMO push (ou no 'load' da window, o que vier primeiro), um único POST
// envia o lote inteiro (1 requisição no lugar de N). Drena em pagehide para
// não perder o lote pendente numa navegação/unload rápido. Usa
// navigator.sendBeacon sempre que possível — sendBeacon não conta para o
// limite de conexões da mesma forma que fetch e é assíncrono sem bloquear
// navegação (Requisito #4); fallback fetch keepalive.

export type DebugLogEntry = {
  tag: string;
  msg: string;
  msSinceMark?: number | null;
  extra?: Record<string, unknown>;
};

const ENDPOINT = '/api/debug-log';
const FLUSH_DEBOUNCE_MS = 300;

let queue: DebugLogEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let unloadGuarded = false;
let loadGuarded = false;

const flush = (): void => {
  // Cancela qualquer debounce pendente: se o flush veio de 'load' ou
  // 'pagehide', o timer do debounce poderia disparar depois e dar um flush
  // duplo (vazio, mas desnecessário). Limpa o handle antes de despachar.
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  const batch = queue;
  queue = [];
  if (batch.length === 0) return;
  // Envelope { events: [...] } — o route.ts desembrulha e loga cada entrada.
  const body = JSON.stringify({ events: batch });
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
  // 300ms seria perdido numa navegação/unload rápido entre o último push e o
  // flush agendado. pagehide é o evento confiável para isso (cobertura
  // bfcache inclusive); o listener vive pelo lifetime da página.
  window.addEventListener('pagehide', flush);
};

const guardLoad = (): void => {
  if (loadGuarded || typeof window === 'undefined') return;
  loadGuarded = true;
  // 'load' da window como segundo gatilho de flush: o boot da página termina
  // quando o load dispara, e é exatamente a janela crítica de contenção de
  // pool que queremos esvaziar. Se o load já disparou (readyState 'complete'),
  // não há o que esperar — o debounce cuida do flush. Caso contrário, descarrega
  // o lote no load, o que vier primeiro (load ou debounce de 300ms).
  if (typeof document !== 'undefined' && document.readyState === 'complete') return;
  window.addEventListener('load', flush, { once: true });
};

export function queueDebugLog(entry: DebugLogEntry): void {
  queue.push(entry);
  guardUnload();
  guardLoad();
  if (flushTimer !== null) clearTimeout(flushTimer);
  // Debounce: 300ms depois do ÚLTIMO push — aguarda os componentes pararem
  // de montar/disparar antes de despachar, maximizando a consolidação num
  // único POST.
  flushTimer = setTimeout(flush, FLUSH_DEBOUNCE_MS);
}
