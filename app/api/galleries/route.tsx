import { NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { galleries } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const data = await db
      .select()
      .from(galleries)
      .where(eq(galleries.isActive, true))
      .orderBy(asc(galleries.displayOrder))
      .limit(100);

    const cleaned = data
      .filter((g) => g.imageUrl && g.imageUrl.trim())
      .map((g) => ({
        ...g,
        imageUrl:
          typeof g.imageUrl === 'string' && g.imageUrl.trim().startsWith('http')
            ? g.imageUrl.trim()
            : null,
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