import type { BillingMode, Prisma } from '@prisma/client';

const dayMs = 24 * 60 * 60 * 1000;
export const commercialTrialDays = 30;
export const commercialGraceDays = 5;

export function isCommercialCustomer(user: { billingMode: BillingMode; isPlatformOwner: boolean }) {
  return user.billingMode === 'COMMERCIAL' && !user.isPlatformOwner;
}

export function canUseCommercialPermission(
  user: { billingMode: BillingMode; isPlatformOwner: boolean },
  permission: string,
) {
  return !isCommercialCustomer(user) || ['admin:access', 'sites:manage'].includes(permission);
}

export type SubscriptionDates = {
  trialEndsAt: Date;
  paidThroughAt: Date | null;
  suspendedAt?: Date | null;
};

export function subscriptionState(
  mode: BillingMode,
  subscription: SubscriptionDates | null,
  at = new Date(),
) {
  if (mode === 'INTERNAL') return { status: 'INTERNAL' as const, dueAt: null, blockedAt: null };
  if (!subscription) return { status: 'BLOCKED' as const, dueAt: null, blockedAt: null };
  const dueAt =
    subscription.paidThroughAt && subscription.paidThroughAt > subscription.trialEndsAt
      ? subscription.paidThroughAt
      : subscription.trialEndsAt;
  const blockedAt = new Date(dueAt.getTime() + commercialGraceDays * dayMs);
  if (subscription.suspendedAt && subscription.suspendedAt <= at)
    return { status: 'BLOCKED' as const, dueAt, blockedAt: subscription.suspendedAt };
  if (at < dueAt)
    return {
      status:
        subscription.paidThroughAt && subscription.paidThroughAt >= subscription.trialEndsAt
          ? ('PAID' as const)
          : ('TRIAL' as const),
      dueAt,
      blockedAt,
    };
  if (at < blockedAt) return { status: 'GRACE' as const, dueAt, blockedAt };
  return { status: 'BLOCKED' as const, dueAt, blockedAt };
}

export function paidThroughAfterPayment(previousDue: Date, paidAt: Date) {
  return new Date(Math.max(previousDue.getTime(), paidAt.getTime()) + commercialTrialDays * dayMs);
}

export function assignableSubscriptionWhere(at = new Date()): Prisma.UserWhereInput {
  const cutoff = new Date(at.getTime() - commercialGraceDays * dayMs);
  return {
    OR: [
      { isPlatformOwner: true },
      { billingMode: 'INTERNAL' },
      {
        billingMode: 'COMMERCIAL',
        subscription: {
          is: {
            AND: [
              { OR: [{ suspendedAt: null }, { suspendedAt: { gt: at } }] },
              { OR: [{ trialEndsAt: { gt: cutoff } }, { paidThroughAt: { gt: cutoff } }] },
            ],
          },
        },
      },
    ],
  };
}
