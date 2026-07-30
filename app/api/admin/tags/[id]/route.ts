import { NextRequest, NextResponse } from 'next/server';
import { db, tags } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

// PATCH update tag
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const body = await req.json();
    const { name, color, category } = body;

    const updated = await db
      .update(tags)
      .set({
        name,
        color,
        category,
        updatedAt: new Date(),
      })
      .where(eq(tags.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating tag:', error);

    return NextResponse.json({ error: 'Failed to update tag' }, { status: 500 });
  }
}

// DELETE tag
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    await db.delete(tags).where(eq(tags.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tag:', error);

    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
  }
}
