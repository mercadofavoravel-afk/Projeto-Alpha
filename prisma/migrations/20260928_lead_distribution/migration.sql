ALTER TABLE "User"
  ADD COLUMN "acceptsLeads" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "leadCapacity" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN "serviceRegions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "lastLeadAssignedAt" TIMESTAMP(3);

CREATE INDEX "User_acceptsLeads_isActive_idx" ON "User"("acceptsLeads", "isActive");
