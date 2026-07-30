import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { workshopBookings, auditLogs } from "@/lib/db/schema";
import { requireAdmin, unauthorizedResponse } from "@/lib/session";
import { getClientIp } from "@/lib/security";

const bulkSchema = z.object({ ids: z.array(z.string().uuid()).min(1).max(500) });

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();
  try {
    const body = await req.json();
    const { ids } = bulkSchema.parse(body);
    const deleted = await db.delete(workshopBookings).where(inArray(workshopBookings.id, ids)).returning();
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "bulk_delete_bookings",
      resourceType: "workshop_booking",
      ipAddress: getClientIp(req),
      metadata: JSON.stringify({ count: deleted.length }),
    });
    return NextResponse.json({ deletedCount: deleted.length });
  } catch (error: any) {
    if (error.name === "ZodError") return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
