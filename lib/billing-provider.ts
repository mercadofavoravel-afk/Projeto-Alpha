export type BillingMethod = 'PIX' | 'BOLETO';

export type BillingChargeRequest = {
  subscriptionId: string;
  customer: {
    reference: string;
    name: string;
    email: string;
  };
  amountCents: number;
  dueAt: Date;
  methods: BillingMethod[];
  idempotencyKey: string;
};

export type BillingCharge = {
  providerChargeId: string;
  status: 'PENDING';
  methods: BillingMethod[];
  checkoutUrl?: string;
  boletoUrl?: string;
  pixCopyPaste?: string;
  expiresAt?: Date;
};

export type NormalizedBillingEvent = {
  eventId: string;
  providerChargeId: string;
  subscriptionId: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELED' | 'REFUNDED';
  amountCents: number;
  occurredAt: Date;
};

/**
 * Implement this contract for a selected billing provider.
 * Implementations must use provider-side idempotency for charge creation,
 * verify webhook signatures against the unmodified request body, and reject
 * duplicate event IDs before returning a normalized event.
 */
export interface BillingProviderAdapter {
  readonly providerId: string;
  createCharge(request: BillingChargeRequest): Promise<BillingCharge>;
  verifyAndNormalizeWebhook(input: {
    rawBody: Uint8Array;
    headers: Record<string, string | string[] | undefined>;
  }): Promise<NormalizedBillingEvent | null>;
}
