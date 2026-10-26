-- CreateTable
CREATE TABLE "public"."LeadRepiqueCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brokerIds" TEXT[],
    "intervalMinutes" INTEGER NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'ONE',
    "status" TEXT NOT NULL DEFAULT 'PAUSED',
    "cursor" INTEGER NOT NULL DEFAULT 0,
    "nextRunAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadRepiqueCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeadRepiqueItem" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "expectedAssignedToId" TEXT,
    "expectedUpdatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assignedToId" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadRepiqueItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadRepiqueCampaign_status_nextRunAt_idx" ON "public"."LeadRepiqueCampaign"("status", "nextRunAt");

-- CreateIndex
CREATE INDEX "LeadRepiqueItem_campaignId_status_createdAt_idx" ON "public"."LeadRepiqueItem"("campaignId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LeadRepiqueItem_campaignId_leadId_key" ON "public"."LeadRepiqueItem"("campaignId", "leadId");

-- AddForeignKey
ALTER TABLE "public"."LeadRepiqueItem" ADD CONSTRAINT "LeadRepiqueItem_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."LeadRepiqueCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadRepiqueItem" ADD CONSTRAINT "LeadRepiqueItem_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

