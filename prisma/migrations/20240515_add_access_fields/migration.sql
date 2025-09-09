-- Add fields for fine-grained access control\nALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accessLevel" TEXT DEFAULT 'full';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accessStartTime" TIME;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accessEndTime" TIME;
-- Optionally, add a JSONB field for per-page access overrides
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pageAccess" JSONB;
