import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { newsletterSubscriptions, auditLogs } from "@/lib/db/schema";
import { requireAdmin, unauthorizedResponse } from "@/lib/session";
import { getClientIp } from "@/lib/security";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();
  try {
    const { id } = await params;
    const result = await db.delete(newsletterSubscriptions).where(eq(newsletterSubscriptions.id, id)).returning();
    if (result.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "delete_newsletter",
      resourceType: "newsletter_subscription",
      resourceId: id,
      ipAddress: getClientIp(req),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
