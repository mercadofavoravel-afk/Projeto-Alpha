ALTER TABLE "MarketingConnection" ADD COLUMN "leadSiteId" TEXT;
CREATE INDEX "MarketingConnection_leadSiteId_idx" ON "MarketingConnection"("leadSiteId");
ALTER TABLE "MarketingConnection" ADD CONSTRAINT "MarketingConnection_leadSiteId_fkey" FOREIGN KEY ("leadSiteId") REFERENCES "CustomerSite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CustomerLead" ADD COLUMN "externalProvider" TEXT;
ALTER TABLE "CustomerLead" ADD COLUMN "externalId" TEXT;
CREATE UNIQUE INDEX "CustomerLead_siteId_externalProvider_externalId_key" ON "CustomerLead"("siteId", "externalProvider", "externalId");
