import { NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { workshops } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const data = await db
      .select()
      .from(workshops)
      .where(eq(workshops.isActive, true))
      .orderBy(asc(workshops.displayOrder))
      .limit(50);

    const cleaned = data
      .filter((w) => w.title && w.description)
      .map((w) => ({
        ...w,
        imageUrl:
          typeof w.imageUrl === 'string' && w.imageUrl.trim().startsWith('http')
            ? w.imageUrl.trim()
            : null,
        startDate: w.startDate ? w.startDate.toISOString() : null,
        endDate: w.endDate ? w.endDate.toISOString() : null,
      }));

    return NextResponse.json(cleaned, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
