import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function requireAdmin() {
  const session = await getServerSession();
  if (!session) return null;

  // Check role from session first
  const userRole = (session.user as any).role;
  if (userRole === "admin") return session;

  // Fallback: fetch fresh from DB (in case session doesn't carry role)
  const [dbUser] = await db.select().from(userTable).where(eq(userTable.id, session.user.id)).limit(1);
  if (!dbUser || dbUser.role !== "admin") return null;

  return { ...session, user: { ...session.user, role: dbUser.role } };
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbiddenResponse() {
  return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
}
