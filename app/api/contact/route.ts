import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { contactInquiries } from "@/lib/db/schema";
import { getClientIp, sanitizeInput } from "@/lib/security";

const contactSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email().max(255),
  message: z.string().min(5).max(5000),
  lgpdConsent: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = contactSchema.parse(body);

    const ipAddress = getClientIp(req);

    const [result] = await db
      .insert(contactInquiries)
      .values({
        name: sanitizeInput(data.name, 255),
        email: data.email.toLowerCase(),
        message: sanitizeInput(data.message),
        ipAddress,
        lgpdConsent: data.lgpdConsent,
      })
      .returning();

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    console.error("Contact error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
