import { NextRequest, NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { newsletterSubscriptions, auditLogs } from "@/lib/db/schema";
import { requireAdmin, unauthorizedResponse } from "@/lib/session";
import { getClientIp } from "@/lib/security";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();
  try {
    const subs = await db
      .select()
      .from(newsletterSubscriptions)
      .orderBy(desc(newsletterSubscriptions.createdAt))
      .limit(1000);
    return NextResponse.json(subs);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
