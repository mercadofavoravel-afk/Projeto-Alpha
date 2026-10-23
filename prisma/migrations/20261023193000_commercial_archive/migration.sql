CREATE TABLE IF NOT EXISTS "ArchiveItem" (
  "id" TEXT PRIMARY KEY,
  "sourceKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'LINK',
  "organization" TEXT,
  "organizationKind" TEXT NOT NULL DEFAULT 'UNCONFIRMED',
  "projectName" TEXT,
  "url" TEXT,
  "fileName" TEXT,
  "mimeType" TEXT,
  "sizeBytes" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'LINK_REGISTERED',
  "origin" TEXT NOT NULL,
  "notes" TEXT,
  "references" JSONB,
  "extractedText" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "ArchiveItem_sourceKey_key" ON "ArchiveItem"("sourceKey");
CREATE INDEX IF NOT EXISTS "ArchiveItem_organization_kind_idx" ON "ArchiveItem"("organization", "kind");
CREATE INDEX IF NOT EXISTS "ArchiveItem_status_idx" ON "ArchiveItem"("status");
