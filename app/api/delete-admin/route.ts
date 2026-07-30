import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, account } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE() {
  try {
    // Find admin
    const existingAdmin = await db
      .select()
      .from(user)
      .where(eq(user.email, "admin@flycrew.com"));

    if (existingAdmin.length === 0) {
      return NextResponse.json({ message: "No admin found to delete" });
    }

    // Delete account first (foreign key constraint)
    await db.delete(account).where(eq(account.userId, existingAdmin[0].id));
    
    // Then delete user
    await db.delete(user).where(eq(user.id, existingAdmin[0].id));

    return NextResponse.json({ 
      success: true,
      message: "Admin user deleted successfully"
    });
  } catch (error: any) {
    console.error("Error deleting admin:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
