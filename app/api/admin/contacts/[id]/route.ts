import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { contactInquiries, auditLogs } from "@/lib/db/schema";
import { requireAdmin, unauthorizedResponse } from "@/lib/session";
import { getClientIp, sanitizeInput } from "@/lib/security";

const updateSchema = z.object({
  status: z.enum(["new", "contacted", "converted", "archived"]).optional(),
  notes: z.string().max(5000).optional().nullable(),
  tags: z.array(z.string()).optional(),
  isRead: z.boolean().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    const updateData: any = { updatedAt: new Date() };
    if (data.status) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes ? sanitizeInput(data.notes) : "";
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.isRead !== undefined) updateData.isRead = data.isRead;
    if (data.priority) updateData.priority = data.priority;

    const [result] = await db
      .update(contactInquiries)
      .set(updateData)
      .where(eq(contactInquiries.id, id))
      .returning();

    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "update_contact",
      resourceType: "contact_inquiry",
      resourceId: id,
      ipAddress: getClientIp(req),
      metadata: JSON.stringify(data),
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }
    console.error("Update contact error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const { id } = await params;
    const result = await db.delete(contactInquiries).where(eq(contactInquiries.id, id)).returning();
    if (result.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "delete_contact",
      resourceType: "contact_inquiry",
      resourceId: id,
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete contact error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
