import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db';
import { testimonials, auditLogs } from '@/lib/db/schema';
import { requireAdmin, unauthorizedResponse } from '@/lib/session';
import { getClientIp, sanitizeInput } from '@/lib/security';

const testimonialSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  instagram: z.string().min(1).max(255).optional(),
  testimonial: z.string().min(5).optional(),
  role: z.string().optional(),
  content: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  imageUrl: z.string().optional(), // removido .max(500)
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

    const data = testimonialSchema.parse(body);

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = sanitizeInput(data.name, 255);
    if (data.instagram !== undefined) updateData.instagram = sanitizeInput(data.instagram, 255);
    if (data.testimonial !== undefined) updateData.testimonial = sanitizeInput(data.testimonial);
    if (data.role !== undefined) updateData.role = sanitizeInput(data.role, 255);
    if (data.content !== undefined) updateData.content = sanitizeInput(data.content);
    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl; // sem sanitizeInput com limite
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder;

    const [updated] = await db
      .update(testimonials)
      .set(updateData)
      .where(eq(testimonials.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }

    if (data.role !== undefined) updateData.role = sanitizeInput(data.role, 255);
    if (data.content !== undefined) updateData.content = sanitizeInput(data.content);
    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.imageUrl !== undefined) updateData.imageUrl = sanitizeInput(data.imageUrl, 500);

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'update_testimonial',
      resourceType: 'testimonial',
      resourceId: id,
      ipAddress: getClientIp(req),
    });

    revalidatePath('/');
    revalidatePath('/api/testimonials');

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PATCH testimonial error:', error);

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

    const deleted = await db.delete(testimonials).where(eq(testimonials.id, id)).returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'delete_testimonial',
      resourceType: 'testimonial',
      resourceId: id,
      ipAddress: getClientIp(req),
    });

    revalidatePath('/');
    revalidatePath('/api/testimonials');

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('DELETE testimonial error:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
