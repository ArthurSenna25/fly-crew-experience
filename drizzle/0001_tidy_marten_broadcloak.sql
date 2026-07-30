ALTER TABLE "testimonials" ADD COLUMN "role" varchar(255) DEFAULT '';--> statement-breakpoint
ALTER TABLE "testimonials" ADD COLUMN "content" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "testimonials" ADD COLUMN "rating" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "testimonials" ADD COLUMN "image_url" varchar(500) DEFAULT '';