import { describe, expect, it } from 'vitest';

import {
  canUseCommercialPermission,
  paidThroughAfterPayment,
  subscriptionState,
} from './commercial-subscription';

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

  it('keeps a commercial customer out of the shared matrix CRM and publishing tools', () => {
    const customer = { billingMode: 'COMMERCIAL' as const, isPlatformOwner: false };
    expect(canUseCommercialPermission(customer, 'sites:manage')).toBe(true);
    expect(canUseCommercialPermission(customer, 'admin:access')).toBe(true);
    expect(canUseCommercialPermission(customer, 'catalog:write')).toBe(false);
    expect(canUseCommercialPermission(customer, 'crm:read')).toBe(false);
    expect(canUseCommercialPermission({ ...customer, isPlatformOwner: true }, 'crm:read')).toBe(
      true,
    );
  });
});
