CREATE TABLE "CustomerSite" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "siteUrl" TEXT NOT NULL,
    "wpUsername" TEXT NOT NULL,
    "applicationPasswordEncrypted" TEXT NOT NULL,
    "wpUserId" INTEGER NOT NULL,
    "wpDisplayName" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CustomerSite_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CustomerSite_siteUrl_key" ON "CustomerSite"("siteUrl");
CREATE INDEX "CustomerSite_ownerId_idx" ON "CustomerSite"("ownerId");
ALTER TABLE "CustomerSite" ADD CONSTRAINT "CustomerSite_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
