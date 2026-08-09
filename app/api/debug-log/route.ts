import { NextResponse } from "next/server";

type DebugLogEntry = {
  msg: string;
  tag?: string;
  msSinceMark?: number | null;
  extra?: Record<string, unknown>;
};

// Loga uma entrada no formato canônico, seja ela vinda sozinha ou em lote.
const logEntry = (entry: DebugLogEntry): void => {
  const { msg, tag, msSinceMark, extra } = entry;
  const label = tag ? `[${tag}]` : "";
  const delta = msSinceMark != null ? ` (+${msSinceMark}ms desde a mark)` : "";
  const extraStr = extra ? ` ${JSON.stringify(extra)}` : "";
  console.log(`[DEBUG-LOG]${label} ${msg}${delta}${extraStr}`);
};

// Aceita três formas de payload, logando cada entrada no mesmo formato
// canônico, independente de ter vindo sozinha ou em lote:
//  1. objeto único — beacons imediatos (erros, visibility, lifecycle,
//     hydration mismatch do Diagnostics) seguem individuais.
//  2. envelopado { events: [...] } — lote batched de lib/debug-log-batch.ts
//     (mount effects + boot diagnostics + section prefetch + longtask).
//  3. array puro — tolerância/legado.
export async function POST(request: Request) {
  const body = await request.json();
  let entries: DebugLogEntry[];
  if (Array.isArray(body)) {
    entries = body as DebugLogEntry[];
  } else if (body && Array.isArray((body as { events?: unknown }).events)) {
    entries = (body as { events: DebugLogEntry[] }).events;
  } else {
    entries = [body as DebugLogEntry];
  }
  for (const entry of entries) {
    logEntry(entry);
  }

  return NextResponse.json({ ok: true });
}
