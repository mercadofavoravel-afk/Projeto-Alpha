CREATE TABLE "RespondiLandingIntegration" (
  "id" TEXT NOT NULL,
  "formId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "pageUrl" TEXT NOT NULL,
  "neighborhood" TEXT NOT NULL,
  "fields" JSONB NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RespondiLandingIntegration_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RespondiLandingIntegration_formId_key" ON "RespondiLandingIntegration"("formId");
