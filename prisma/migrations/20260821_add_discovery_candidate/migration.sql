CREATE TYPE "DiscoveryCandidateStatus" AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'IMPORTED'
);

CREATE TYPE "DiscoveryCandidateKind" AS ENUM (
  'PROJECT',
  'NEIGHBORHOOD',
  'DOCUMENT',
  'ARTICLE',
  'DEVELOPER',
  'OTHER'
);

CREATE TABLE "DiscoveryCandidate" (
  "id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "title" TEXT,
  "kind" "DiscoveryCandidateKind" NOT NULL,
  "score" INTEGER NOT NULL DEFAULT 0,
  "status" "DiscoveryCandidateStatus" NOT NULL DEFAULT 'PENDING',

  "sourceRootId" TEXT NOT NULL,
  "sourceRootName" TEXT NOT NULL,
  "sourceRootUrl" TEXT NOT NULL,
  "sourceRootKind" TEXT,

  "importedProjectId" TEXT,
  "metadata" JSONB,

  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "importedAt" TIMESTAMP(3),

  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DiscoveryCandidate_pkey"
    PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX
  "DiscoveryCandidate_url_key"
ON
  "DiscoveryCandidate"("url");

CREATE INDEX
  "DiscoveryCandidate_status_idx"
ON
  "DiscoveryCandidate"("status");

CREATE INDEX
  "DiscoveryCandidate_kind_idx"
ON
  "DiscoveryCandidate"("kind");

CREATE INDEX
  "DiscoveryCandidate_score_idx"
ON
  "DiscoveryCandidate"("score");

CREATE INDEX
  "DiscoveryCandidate_sourceRootId_idx"
ON
  "DiscoveryCandidate"("sourceRootId");

CREATE INDEX
  "DiscoveryCandidate_importedProjectId_idx"
ON
  "DiscoveryCandidate"("importedProjectId");

CREATE INDEX
  "DiscoveryCandidate_lastSeenAt_idx"
ON
  "DiscoveryCandidate"("lastSeenAt");
