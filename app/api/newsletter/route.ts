import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { newsletterSubscriptions } from "@/lib/db/schema";
import { getClientIp, generateUnsubscribeToken } from "@/lib/security";

const newsletterSchema = z.object({
  email: z.string().email().max(255),
  lgpdConsent: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = newsletterSchema.parse(body);
    const email = data.email.toLowerCase();

    const existing = await db
      .select()
      .from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "Email already subscribed" }, { status: 400 });
    }

    const [result] = await db
      .insert(newsletterSubscriptions)
      .values({
        email,
        ipAddress: getClientIp(req),
        lgpdConsent: data.lgpdConsent,
        unsubscribeToken: generateUnsubscribeToken(),
      })
      .returning();

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("Newsletter error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
