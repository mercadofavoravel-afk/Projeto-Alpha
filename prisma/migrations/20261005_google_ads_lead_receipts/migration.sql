CREATE TABLE "ExternalLeadReceipt" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExternalLeadReceipt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExternalLeadReceipt_provider_externalId_key" ON "ExternalLeadReceipt"("provider", "externalId");
CREATE INDEX "ExternalLeadReceipt_leadId_idx" ON "ExternalLeadReceipt"("leadId");
ALTER TABLE "ExternalLeadReceipt" ADD CONSTRAINT "ExternalLeadReceipt_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
