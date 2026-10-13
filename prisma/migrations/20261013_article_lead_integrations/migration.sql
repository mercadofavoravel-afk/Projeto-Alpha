CREATE TABLE "ArticleLeadIntegration" (
  "id" TEXT NOT NULL,
  "articleId" TEXT NOT NULL,
  "respondiFormId" TEXT,
  "respondiUrl" TEXT,
  "tintimUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ArticleLeadIntegration_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ArticleLeadIntegration_articleId_key" ON "ArticleLeadIntegration"("articleId");
CREATE UNIQUE INDEX "ArticleLeadIntegration_respondiFormId_key" ON "ArticleLeadIntegration"("respondiFormId");
CREATE UNIQUE INDEX "ArticleLeadIntegration_tintimUrl_key" ON "ArticleLeadIntegration"("tintimUrl");
ALTER TABLE "ArticleLeadIntegration" ADD CONSTRAINT "ArticleLeadIntegration_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
