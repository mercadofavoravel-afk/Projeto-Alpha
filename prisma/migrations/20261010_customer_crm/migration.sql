CREATE TABLE "CustomerLead" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "articleId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "objective" "LeadObjective" NOT NULL DEFAULT 'OTHER',
    "typology" TEXT,
    "message" TEXT,
    "consent" BOOLEAN NOT NULL,
    "source" TEXT NOT NULL,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CustomerLead_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CustomerLead_siteId_createdAt_idx" ON "CustomerLead"("siteId", "createdAt");
CREATE INDEX "CustomerLead_siteId_status_idx" ON "CustomerLead"("siteId", "status");
CREATE INDEX "CustomerLead_articleId_idx" ON "CustomerLead"("articleId");
CREATE INDEX "CustomerLead_siteId_phone_createdAt_idx" ON "CustomerLead"("siteId", "phone", "createdAt");
ALTER TABLE "CustomerLead" ADD CONSTRAINT "CustomerLead_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "CustomerSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomerLead" ADD CONSTRAINT "CustomerLead_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "CustomerArticle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "CustomerLeadActivity" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "note" TEXT,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerLeadActivity_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CustomerLeadActivity_leadId_createdAt_idx" ON "CustomerLeadActivity"("leadId", "createdAt");
CREATE INDEX "CustomerLeadActivity_dueAt_completedAt_idx" ON "CustomerLeadActivity"("dueAt", "completedAt");
ALTER TABLE "CustomerLeadActivity" ADD CONSTRAINT "CustomerLeadActivity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "CustomerLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
