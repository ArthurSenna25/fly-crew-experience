import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db';
import { galleries, auditLogs } from '@/lib/db/schema';
import { requireAdmin, unauthorizedResponse } from '@/lib/session';
import { getClientIp, sanitizeInput } from '@/lib/security';

const gallerySchema = z.object({
  imageUrl: z.string().url().optional(),
  caption: z.string().min(2).max(200).optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();

  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;

    const body = await req.json();

    const data = gallerySchema.parse(body);

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.imageUrl !== undefined) {
      updateData.imageUrl = sanitizeInput(data.imageUrl);
    }
    if (data.caption !== undefined) {
      updateData.caption = sanitizeInput(data.caption, 200);
    }
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }
    if (data.displayOrder !== undefined) {
      updateData.displayOrder = data.displayOrder;
    }

    const [updated] = await db
      .update(galleries)
      .set(updateData)
      .where(eq(galleries.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'update_gallery',
      resourceType: 'gallery',
      resourceId: id,
      ipAddress: getClientIp(req),
    });

    revalidatePath('/');

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PATCH gallery error:', error);

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

    const result = await db.delete(galleries).where(eq(galleries.id, id)).returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'delete_gallery',
      resourceType: 'gallery',
      resourceId: id,
      ipAddress: getClientIp(req),
    });

    revalidatePath('/');

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('DELETE gallery error:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}