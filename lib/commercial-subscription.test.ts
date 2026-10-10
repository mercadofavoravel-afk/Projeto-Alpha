import { describe, expect, it } from 'vitest';

import { paidThroughAfterPayment, subscriptionState } from './commercial-subscription';

describe('commercial subscription access', () => {
  const trialEndsAt = new Date('2026-11-01T00:00:00Z');
  const subscription = { trialEndsAt, paidThroughAt: null };

  it('keeps the matrix independent from customer billing and grants 30 days plus five days', () => {
    expect(subscriptionState('INTERNAL', null, new Date('2030-01-01')).status).toBe('INTERNAL');
    expect(
      subscriptionState('COMMERCIAL', subscription, new Date('2026-10-31T23:59:59Z')).status,
    ).toBe('TRIAL');
    expect(subscriptionState('COMMERCIAL', subscription, trialEndsAt).status).toBe('GRACE');
    expect(
      subscriptionState('COMMERCIAL', subscription, new Date('2026-11-05T23:59:59Z')).status,
    ).toBe('GRACE');
    expect(
      subscriptionState('COMMERCIAL', subscription, new Date('2026-11-06T00:00:00Z')).status,
    ).toBe('BLOCKED');
    expect(subscriptionState('COMMERCIAL', null).status).toBe('BLOCKED');
  });

  it('extends one paid 30-day period from payment day if late', () => {
    const paidAt = new Date('2026-11-07T00:00:00Z');
    const paidThroughAt = paidThroughAfterPayment(trialEndsAt, paidAt);
    expect(paidThroughAt.toISOString()).toBe('2026-12-07T00:00:00.000Z');
    expect(subscriptionState('COMMERCIAL', { trialEndsAt, paidThroughAt }, paidAt).status).toBe(
      'PAID',
    );
  });
});
