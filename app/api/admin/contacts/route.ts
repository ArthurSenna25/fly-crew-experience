import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { contactInquiries } from "@/lib/db/schema";
import { forbiddenResponse, requireAdmin, unauthorizedResponse } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return req.headers.get("authorization") ? forbiddenResponse() : unauthorizedResponse();
  }

  try {
    const inquiries = await db
      .select()
      .from(contactInquiries)
      .orderBy(desc(contactInquiries.createdAt))
      .limit(1000);

    return NextResponse.json(inquiries);
  } catch (error) {
    console.error("Get contacts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
