import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });

import { db } from "../lib/db";
import { workshops } from "../lib/db/schema";
import { auth } from "../lib/auth";
import { eq } from "drizzle-orm";
import { user as userTable } from "../lib/db/schema";

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || "";
  const password = process.env.ADMIN_PASSWORD || "";

  const existing = await db.select().from(userTable).where(eq(userTable.email, email)).limit(1);

  if (existing.length === 0) {
    try {
      const result = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name: "Admin",
        },
      });

      // Update role to admin
      await db.update(userTable).set({ role: "admin" }).where(eq(userTable.email, email));
      console.log(`✓ Admin created: ${email}`);
    } catch (error: any) {
      console.error("Error creating admin:", error.message);
    }
  } else {
    // Ensure existing user is admin
    await db.update(userTable).set({ role: "admin" }).where(eq(userTable.email, email));
    console.log(`✓ Admin already exists: ${email} (role updated)`);
  }
}

async function seedWorkshops() {
  const existing = await db.select().from(workshops).limit(1);
  if (existing.length > 0) {
    console.log("✓ Workshops already seeded");
    return;
  }

  const defaultWorkshops = [
    {
      title: "Professional Presence Workshop",
      duration: "2 Days",
      capacity: "12 Participants",
      description:
        "Master the art of commanding presence, elegant communication, and sophisticated body language.",
      displayOrder: 1,
    },
    {
      title: "Interview Excellence Masterclass",
      duration: "1 Day",
      capacity: "15 Participants",
      description:
        "Transform interview anxiety into confident performance with proven techniques and personalized feedback.",
      displayOrder: 2,
    },
    {
      title: "Aviation Lifestyle Immersion",
      duration: "3 Days",
      capacity: "10 Participants",
      description:
        "Experience the complete aviation lifestyle through exclusive mentoring and real-world preparation.",
      displayOrder: 3,
    },
  ];

  await db.insert(workshops).values(defaultWorkshops);
  console.log(`✓ ${defaultWorkshops.length} workshops seeded`);
}

async function main() {
  console.log("=== Seeding database ===");
  await seedAdmin();
  await seedWorkshops();
  console.log("✓ Seeding complete");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
