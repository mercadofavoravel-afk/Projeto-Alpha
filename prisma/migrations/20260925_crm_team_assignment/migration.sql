ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'MANAGER';

ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "assignedToId" TEXT;

CREATE INDEX IF NOT EXISTS "Lead_assignedToId_idx" ON "Lead"("assignedToId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Lead_assignedToId_fkey'
  ) THEN
    ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey"
      FOREIGN KEY ("assignedToId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
