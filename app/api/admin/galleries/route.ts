import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { asc, desc } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db';
import { galleries, auditLogs } from '@/lib/db/schema';
import { requireAdmin, unauthorizedResponse } from '@/lib/session';
import { getClientIp, sanitizeInput } from '@/lib/security';

const gallerySchema = z.object({
  imageUrl: z.string().url(),
  caption: z.string().min(2).max(200),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
});

export async function GET() {
  const session = await requireAdmin();

  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const all = await db
      .select()
      .from(galleries)
      .orderBy(asc(galleries.displayOrder), desc(galleries.createdAt));

    return NextResponse.json(all);
  } catch (error) {
    console.error('GET galleries error:', error);

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

    const data = gallerySchema.parse(body);

    const [created] = await db
      .insert(galleries)
      .values({
        imageUrl: sanitizeInput(data.imageUrl),
        caption: sanitizeInput(data.caption, 200),
        isActive: data.isActive,
        displayOrder: data.displayOrder,
      })
      .returning();

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: 'create_gallery',
      resourceType: 'gallery',
      resourceId: created.id,
      ipAddress: getClientIp(req),
    });

    revalidatePath('/');

    return NextResponse.json(created, {
      status: 201,
    });
  } catch (error: any) {
    console.error('POST gallery error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}