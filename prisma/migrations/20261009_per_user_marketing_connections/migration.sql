CREATE TABLE "MarketingConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "displayName" TEXT,
    "email" TEXT,
    "accessTokenEncrypted" TEXT NOT NULL,
    "refreshTokenEncrypted" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scopes" TEXT,
    "selectedAccountId" TEXT,
    "selectedAccountName" TEXT,
    "selectedTokenEncrypted" TEXT,
    "webhookKeyHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MarketingConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MarketingConnection_userId_provider_key" ON "MarketingConnection"("userId", "provider");
CREATE UNIQUE INDEX "MarketingConnection_provider_selectedAccountId_key" ON "MarketingConnection"("provider", "selectedAccountId");
CREATE UNIQUE INDEX "MarketingConnection_webhookKeyHash_key" ON "MarketingConnection"("webhookKeyHash");
CREATE INDEX "MarketingConnection_provider_providerUserId_idx" ON "MarketingConnection"("provider", "providerUserId");
ALTER TABLE "MarketingConnection" ADD CONSTRAINT "MarketingConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "MarketingAuthState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "stateHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MarketingAuthState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MarketingAuthState_stateHash_key" ON "MarketingAuthState"("stateHash");
CREATE INDEX "MarketingAuthState_userId_provider_idx" ON "MarketingAuthState"("userId", "provider");
CREATE INDEX "MarketingAuthState_expiresAt_idx" ON "MarketingAuthState"("expiresAt");
ALTER TABLE "MarketingAuthState" ADD CONSTRAINT "MarketingAuthState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
