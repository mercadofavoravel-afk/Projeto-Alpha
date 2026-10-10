CREATE TYPE "CustomerArticleStatus" AS ENUM ('DRAFT', 'REVIEW', 'REMOTE_DRAFT', 'PUBLISHED');
CREATE TABLE "CustomerArticle" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "seoTitle" TEXT NOT NULL,
    "seoDescription" TEXT NOT NULL,
    "status" "CustomerArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "wpPostId" INTEGER,
    "publicUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CustomerArticle_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CustomerArticle_siteId_slug_key" ON "CustomerArticle"("siteId", "slug");
CREATE INDEX "CustomerArticle_siteId_status_idx" ON "CustomerArticle"("siteId", "status");
ALTER TABLE "CustomerArticle" ADD CONSTRAINT "CustomerArticle_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "CustomerSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
