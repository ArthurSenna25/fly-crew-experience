import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  varchar,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core';

// Status enums for type safety
export const contactStatusEnum = pgEnum('contact_status', [
  'new',
  'contacted',
  'converted',
  'archived',
]);

export const bookingStatusEnum = pgEnum('booking_status', [
  'new',
  'contacted',
  'converted',
  'archived',
]);

export const newsletterStatusEnum = pgEnum('newsletter_status', ['active', 'unsubscribed']);

// ============ Better Auth Tables ============
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============ Application Tables ============
export const contactInquiries = pgTable('contact_inquiries', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  message: text('message').notNull(),
  status: contactStatusEnum('status').notNull().default('new'),
  notes: text('notes').default(''),
  tags: text('tags').array().default([]),
  isRead: boolean('is_read').notNull().default(false),
  priority: varchar('priority', { length: 20 }).default('normal'),
  ipAddress: varchar('ip_address', { length: 45 }),
  lgpdConsent: boolean('lgpd_consent').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const newsletterSubscriptions = pgTable('newsletter_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  status: newsletterStatusEnum('status').notNull().default('active'),
  ipAddress: varchar('ip_address', { length: 45 }),
  lgpdConsent: boolean('lgpd_consent').notNull().default(true),
  unsubscribeToken: varchar('unsubscribe_token', { length: 64 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const workshopBookings = pgTable('workshop_bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  workshopType: varchar('workshop_type', { length: 100 }).notNull(),
  preferredDate: varchar('preferred_date', { length: 100 }),
  message: text('message'),
  status: bookingStatusEnum('status').notNull().default('new'),
  notes: text('notes').default(''),
  tags: text('tags').array().default([]),
  isRead: boolean('is_read').notNull().default(false),
  priority: varchar('priority', { length: 20 }).default('normal'),
  ipAddress: varchar('ip_address', { length: 45 }),
  lgpdConsent: boolean('lgpd_consent').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const workshops = pgTable('workshops', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  duration: varchar('duration', { length: 100 }).notNull(),
  capacity: varchar('capacity', { length: 100 }).notNull(),
  description: text('description').notNull(),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  imageUrl: text('image_url').default(''),
  isActive: boolean('is_active').notNull().default(true),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Testimonials / Student Feedbacks
export const testimonials = pgTable('testimonials', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  instagram: varchar('instagram', { length: 255 }).notNull(),
  testimonial: text('testimonial').notNull(),
  role: varchar('role', { length: 255 }).default(''),
  content: text('content').default(''),
  rating: integer('rating').notNull().default(5),
  imageUrl: text('image_url').default(''),
  isActive: boolean('is_active').notNull().default(true),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const galleries = pgTable('galleries', {
  id: uuid('id').primaryKey().defaultRandom(),
  imageUrl: text('image_url').notNull(),
  caption: text('caption').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Tags system
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  color: varchar('color', { length: 20 }).notNull().default('blue'),
  category: varchar('category', { length: 50 }).default('general'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Audit log for LGPD compliance
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id'),
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 100 }),
  resourceId: text('resource_id'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Rate limiting / brute force protection
export const loginAttempts = pgTable('login_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  identifier: varchar('identifier', { length: 255 }).notNull().unique(),
  attempts: integer('attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until'),
  lastAttemptAt: timestamp('last_attempt_at').notNull().defaultNow(),
});

// Types for TypeScript
export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type ContactInquiry = typeof contactInquiries.$inferSelect;
export type NewContactInquiry = typeof contactInquiries.$inferInsert;
export type NewsletterSubscription = typeof newsletterSubscriptions.$inferSelect;
export type NewNewsletterSubscription = typeof newsletterSubscriptions.$inferInsert;
export type WorkshopBooking = typeof workshopBookings.$inferSelect;
export type NewWorkshopBooking = typeof workshopBookings.$inferInsert;
export type Workshop = typeof workshops.$inferSelect;
export type NewWorkshop = typeof workshops.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type Testimonial = typeof testimonials.$inferSelect;
export type NewTestimonial = typeof testimonials.$inferInsert;
export type Gallery = typeof galleries.$inferSelect;
export type NewGallery = typeof galleries.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
