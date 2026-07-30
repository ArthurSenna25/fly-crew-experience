import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { workshopBookings } from '@/lib/db/schema';
import { getClientIp, sanitizeInput } from '@/lib/security';

const bookingSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email().max(255),
  phone: z.string().min(8).max(50),
  workshopType: z.string().min(1).max(255),
  preferredDate: z.string().max(100).optional().nullable(),
  message: z.string().max(5000).optional().nullable(),
  lgpdConsent: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = bookingSchema.parse(body);

    const [result] = await db
      .insert(workshopBookings)
      .values({
        name: sanitizeInput(data.name, 255),
        email: sanitizeInput(data.email, 255).toLowerCase(),
        phone: sanitizeInput(data.phone, 50),
        workshopType: sanitizeInput(data.workshopType, 255),
        preferredDate: data.preferredDate ? sanitizeInput(data.preferredDate, 100) : null,
        message: data.message ? sanitizeInput(data.message) : null,
        ipAddress: getClientIp(req),
        lgpdConsent: data.lgpdConsent,
      })
      .returning();

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 },
      );
    }
    console.error('Booking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
