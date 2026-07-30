  import { NextResponse } from "next/server";

  export async function POST(request: Request) {
    const body = await request.json();
    const { msg, tag, msSinceMark, extra } = body as {
      msg: string;
      tag?: string;
      msSinceMark?: number | null;
      extra?: Record<string, unknown>;
    };

    const label = tag ? `[${tag}]` : "";
    const delta = msSinceMark != null ? ` (+${msSinceMark}ms desde a mark)` : "";
    const extraStr = extra ? ` ${JSON.stringify(extra)}` : "";

    console.log(`[DEBUG-LOG]${label} ${msg}${delta}${extraStr}`);

    return NextResponse.json({ ok: true });
  }
