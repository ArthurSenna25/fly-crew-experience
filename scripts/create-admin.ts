import { db } from '../lib/db';
import { user } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function createAdminUser() {
  try {
    // Check if admin exists
    const existingAdmin = await db.select().from(user).where(eq(user.email, 'admin@flycrew.com'));

    if (existingAdmin.length > 0) {
      console.log('✓ Admin user already exists');
      console.log('Email: admin@flycrew.com');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('FlyCrew2026!', 10);

    const newAdmin = await db
      .insert(user)
      .values({
        id: crypto.randomUUID(),
        email: 'admin@flycrew.com',
        name: 'Administrator',
        role: 'admin',
        emailVerified: true,
      })
      .returning();

    // Create account with password
    const { account } = await import('../lib/db/schema');
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: newAdmin[0].id,
      providerId: 'credential',
      userId: newAdmin[0].id,
      password: hashedPassword,
    });

    console.log('✓ Admin user created successfully!');
    console.log('Email: admin@flycrew.com');
    console.log('Password: FlyCrew2026!');
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

createAdminUser();
