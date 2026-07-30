import { NextResponse } from 'next/server';
import { and, asc, eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { testimonials } from '@/lib/db/schema';

export async function GET() {
  try {
    const data = await db
      .select()
      .from(testimonials)
      .where(and(eq(testimonials.isActive, true)))
      .orderBy(asc(testimonials.displayOrder), asc(testimonials.createdAt))
      .limit(50);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Testimonials GET error:', error);

    return NextResponse.json(
      {
        error: 'Erro ao buscar depoimentos',
      },
      {
        status: 500,
      },
    );
  }
}
