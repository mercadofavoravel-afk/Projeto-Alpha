CREATE TYPE "BillingMode" AS ENUM ('INTERNAL', 'COMMERCIAL');
CREATE TYPE "BillingPaymentStatus" AS ENUM ('PENDING', 'PAID', 'CANCELED');
ALTER TABLE "User" ADD COLUMN "billingMode" "BillingMode" NOT NULL DEFAULT 'INTERNAL';
ALTER TABLE "User" ADD COLUMN "isPlatformOwner" BOOLEAN NOT NULL DEFAULT false;
UPDATE "User" SET "isPlatformOwner" = true WHERE "role" = 'ADMIN';

CREATE TABLE "CommercialSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trialStartsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trialEndsAt" TIMESTAMP(3) NOT NULL,
    "paidThroughAt" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "amountCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CommercialSubscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CommercialSubscription_userId_key" ON "CommercialSubscription"("userId");
CREATE INDEX "CommercialSubscription_trialEndsAt_idx" ON "CommercialSubscription"("trialEndsAt");
CREATE INDEX "CommercialSubscription_paidThroughAt_idx" ON "CommercialSubscription"("paidThroughAt");
ALTER TABLE "CommercialSubscription" ADD CONSTRAINT "CommercialSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "BillingPayment" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" "BillingPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "providerRef" TEXT,
    "boletoUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BillingPayment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BillingPayment_providerRef_key" ON "BillingPayment"("providerRef");
CREATE INDEX "BillingPayment_subscriptionId_dueAt_idx" ON "BillingPayment"("subscriptionId", "dueAt");
CREATE INDEX "BillingPayment_status_dueAt_idx" ON "BillingPayment"("status", "dueAt");
ALTER TABLE "BillingPayment" ADD CONSTRAINT "BillingPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "CommercialSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
