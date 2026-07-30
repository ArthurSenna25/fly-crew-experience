import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { workshopBookings } from "@/lib/db/schema";
import { requireAdmin, unauthorizedResponse } from "@/lib/session";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();
  try {
    const bookings = await db.select().from(workshopBookings).orderBy(desc(workshopBookings.createdAt)).limit(1000);
    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
