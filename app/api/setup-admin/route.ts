import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

// Teste
const ADMIN_EMAIL = "";
const ADMIN_PASSWORD = "";

export async function POST() {
  try {
    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(user)
      .where(eq(user.email, ADMIN_EMAIL));

    if (existingAdmin.length > 0) {
      return NextResponse.json({
        message: "Admin already exists. Use these credentials to login:",
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      });
    }

    // Use Better Auth's built-in signup to create user with proper password hash
    const result = await auth.api.signUpEmail({
      body: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        name: "Admin",
      },
    });

    if (!result || !result.user) {
      throw new Error("Failed to create user");
    }

    // Update user role to admin
    await db
      .update(user)
      .set({ role: "admin", emailVerified: true })
      .where(eq(user.id, result.user.id));

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully!",
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      userId: result.user.id
    });
  } catch (error: any) {
    console.error("Error creating admin:", error);
    return NextResponse.json({
      error: error.message,
      details: "If user exists, try deleting from database first"
    }, { status: 500 });
  }
}
