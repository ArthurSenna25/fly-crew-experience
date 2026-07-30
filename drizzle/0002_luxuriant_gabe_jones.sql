ALTER TABLE "testimonials" ALTER COLUMN "image_url" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "testimonials" ALTER COLUMN "image_url" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "workshops" ADD COLUMN "image_url" text DEFAULT '';