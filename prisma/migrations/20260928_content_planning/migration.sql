CREATE TYPE "ContentPlanStatus" AS ENUM (
  'DRAFT', 'READY', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'
);

CREATE TYPE "PublicationChannel" AS ENUM (
  'INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'YOUTUBE', 'TIKTOK', 'KWAI', 'BLOG'
);

CREATE TYPE "PublicationStatus" AS ENUM (
  'PENDING', 'READY', 'SCHEDULED', 'PUBLISHED', 'FAILED', 'CANCELED'
);

CREATE TABLE "ContentPlan" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "topic" TEXT,
  "targetAudience" TEXT,
  "region" TEXT,
  "projectName" TEXT,
  "caption" TEXT,
  "cta" TEXT NOT NULL,
  "destinationUrl" TEXT NOT NULL,
  "assetUrl" TEXT,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "status" "ContentPlanStatus" NOT NULL DEFAULT 'DRAFT',
  "articleId" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContentPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PublicationAttempt" (
  "id" TEXT NOT NULL,
  "contentPlanId" TEXT NOT NULL,
  "channel" "PublicationChannel" NOT NULL,
  "status" "PublicationStatus" NOT NULL DEFAULT 'PENDING',
  "externalUrl" TEXT,
  "errorMessage" TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PublicationAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContentPlan_scheduledAt_idx" ON "ContentPlan"("scheduledAt");
CREATE INDEX "ContentPlan_status_idx" ON "ContentPlan"("status");
CREATE INDEX "ContentPlan_articleId_idx" ON "ContentPlan"("articleId");
CREATE INDEX "ContentPlan_createdById_idx" ON "ContentPlan"("createdById");
CREATE UNIQUE INDEX "PublicationAttempt_contentPlanId_channel_key"
  ON "PublicationAttempt"("contentPlanId", "channel");
CREATE INDEX "PublicationAttempt_channel_status_idx"
  ON "PublicationAttempt"("channel", "status");
CREATE INDEX "PublicationAttempt_publishedAt_idx" ON "PublicationAttempt"("publishedAt");

ALTER TABLE "ContentPlan" ADD CONSTRAINT "ContentPlan_articleId_fkey"
  FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ContentPlan" ADD CONSTRAINT "ContentPlan_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PublicationAttempt" ADD CONSTRAINT "PublicationAttempt_contentPlanId_fkey"
  FOREIGN KEY ("contentPlanId") REFERENCES "ContentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
