import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db';
import { workshops, auditLogs } from '@/lib/db/schema';
import { requireAdmin, unauthorizedResponse } from '@/lib/session';
import { getClientIp, sanitizeInput } from '@/lib/security';

const workshopSchema = z.object({
  title: z.string().min(2).max(255).optional(),
  duration: z.string().min(1).max(100).optional(),
  capacity: z.string().min(1).max(100).optional(),
  description: z.string().min(5).optional(),

  imageUrl: z.string().optional(),

  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();

  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;

    const body = await req.json();

    const data = workshopSchema.parse(body);

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.title) {
      updateData.title = sanitizeInput(data.title, 255);
    }

    if (data.duration) {
      updateData.duration = sanitizeInput(data.duration, 100);
    }

    if (data.capacity) {
      updateData.capacity = sanitizeInput(data.capacity, 100);
    }

    if (data.description) {
      updateData.description = sanitizeInput(data.description);
    }

    if (data.imageUrl !== undefined) {
      updateData.imageUrl = sanitizeInput(data.imageUrl);
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    if (data.displayOrder !== undefined) {
      updateData.displayOrder = data.displayOrder;
    }

    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    }

    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    }

    const [updated] = await db
      .update(workshops)
      .set(updateData)
      .where(eq(workshops.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'update_workshop',
      resourceType: 'workshop',
      resourceId: id,
      ipAddress: getClientIp(req),
    });

    revalidatePath('/');

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PATCH workshop error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();

  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;

    const result = await db.delete(workshops).where(eq(workshops.id, id)).returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'delete_workshop',
      resourceType: 'workshop',
      resourceId: id,
      ipAddress: getClientIp(req),
    });

    revalidatePath('/');

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('DELETE workshop error:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
