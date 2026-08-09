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

// Aceita tanto um objeto ÚNICO (beacons imediatos: heartbeat do Diagnostics,
// erros, lifecycle, SectionPrefetch) quanto um ARRAY de objetos (lote batched
// de "mount effects complete" enviado pela fila em lib/debug-log-batch.ts).
// Loga cada entrada no mesmo formato, independente de ter vindo sozinha ou em
// lote — mantendo compatibilidade total com os chamadores existentes.
export async function POST(request: Request) {
  const body = await request.json();
  if (Array.isArray(body)) {
    for (const entry of body) {
      logEntry(entry as DebugLogEntry);
    }
  } else {
    logEntry(body as DebugLogEntry);
  }

  return NextResponse.json({ ok: true });
}
