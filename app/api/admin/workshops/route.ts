import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { desc, asc } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db';
import { workshops, auditLogs } from '@/lib/db/schema';
import { requireAdmin, unauthorizedResponse } from '@/lib/session';
import { getClientIp, sanitizeInput } from '@/lib/security';

const workshopSchema = z.object({
  title: z.string().min(2).max(255),
  duration: z.string().min(1).max(100),
  capacity: z.string().min(1).max(100),
  description: z.string().min(5),

  imageUrl: z.string().optional().default(''),

  isActive: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

export async function GET() {
  const session = await requireAdmin();

  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const all = await db
      .select()
      .from(workshops)
      .orderBy(asc(workshops.displayOrder), desc(workshops.createdAt));

    return NextResponse.json(all);
  } catch (error) {
    console.error('GET workshops error:', error);

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

    const data = workshopSchema.parse(body);

    const [created] = await db
      .insert(workshops)
      .values({
        title: sanitizeInput(data.title, 255),
        duration: sanitizeInput(data.duration, 100),
        capacity: sanitizeInput(data.capacity, 100),
        description: sanitizeInput(data.description),

        imageUrl: sanitizeInput(data.imageUrl || ''),

        isActive: data.isActive,
        displayOrder: data.displayOrder,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      })
      .returning();

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'create_workshop',
      resourceType: 'workshop',
      resourceId: created.id,
      ipAddress: getClientIp(req),
    });

    revalidatePath('/');

    return NextResponse.json(created, {
      status: 201,
    });
  } catch (error: any) {
    console.error('POST workshop error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
