-- AlterTable
ALTER TABLE "public"."Lead" ADD COLUMN     "routingQueueId" TEXT;

-- CreateTable
CREATE TABLE "public"."LeadRouletteQueue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "regions" TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "shifts" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadRouletteQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeadRouletteShift" (
    "id" TEXT NOT NULL,
    "queueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "drawnAt" TIMESTAMP(3),
    "nextPosition" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LeadRouletteShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeadRouletteEntry" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" INTEGER,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedOutAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadRouletteEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadRouletteShift_endsAt_idx" ON "public"."LeadRouletteShift"("endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "LeadRouletteShift_queueId_startsAt_key" ON "public"."LeadRouletteShift"("queueId", "startsAt");

-- CreateIndex
CREATE INDEX "LeadRouletteEntry_userId_checkedOutAt_idx" ON "public"."LeadRouletteEntry"("userId", "checkedOutAt");

-- CreateIndex
CREATE UNIQUE INDEX "LeadRouletteEntry_shiftId_userId_key" ON "public"."LeadRouletteEntry"("shiftId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadRouletteEntry_shiftId_position_key" ON "public"."LeadRouletteEntry"("shiftId", "position");

-- CreateIndex
CREATE INDEX "Lead_routingQueueId_assignedToId_createdAt_idx" ON "public"."Lead"("routingQueueId", "assignedToId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."Lead" ADD CONSTRAINT "Lead_routingQueueId_fkey" FOREIGN KEY ("routingQueueId") REFERENCES "public"."LeadRouletteQueue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadRouletteShift" ADD CONSTRAINT "LeadRouletteShift_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "public"."LeadRouletteQueue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadRouletteEntry" ADD CONSTRAINT "LeadRouletteEntry_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "public"."LeadRouletteShift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadRouletteEntry" ADD CONSTRAINT "LeadRouletteEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
