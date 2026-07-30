import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { asc, desc } from 'drizzle-orm';
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
  imageUrl: z.string().optional(), 
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

export async function GET() {
  const session = await requireAdmin();

  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const allTestimonials = await db
      .select()
      .from(testimonials)
      .orderBy(asc(testimonials.displayOrder), desc(testimonials.createdAt));

    return NextResponse.json(allTestimonials);
  } catch (error) {
    console.error('GET testimonials error:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();

  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const body = await req.json();

    const data = testimonialSchema.parse(body);

    const payload: any = {
      name: data.name ? sanitizeInput(data.name, 255) : undefined,
      instagram: data.instagram ? sanitizeInput(data.instagram, 255) : undefined,
      testimonial: data.testimonial ? sanitizeInput(data.testimonial) : undefined,
      isActive: data.isActive,
      displayOrder: data.displayOrder,
    };

    const [created] = await db
      .insert(testimonials)
      .values(payload)
      .returning();

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'create_testimonial',
      resourceType: 'testimonial',
      resourceId: created.id,
      ipAddress: getClientIp(req),
    });

    revalidatePath('/');
    revalidatePath('/api/testimonials');

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('POST testimonial error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
