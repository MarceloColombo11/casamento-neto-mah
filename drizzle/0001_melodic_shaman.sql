ALTER TYPE "public"."media_source" ADD VALUE 'db';--> statement-breakpoint
ALTER TABLE "site_media" ADD COLUMN "bytes" "bytea";