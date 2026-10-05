import { describe, expect, it } from 'vitest';

import { crmDayStartAfter, crmDayWindow } from './crm-day';

describe('crmDayWindow', () => {
  it('uses the business day in Rio instead of UTC midnight', () => {
    const lateSunday = crmDayWindow(new Date('2026-10-05T02:30:00.000Z'));
    expect(lateSunday.today.toISOString()).toBe('2026-10-04T03:00:00.000Z');
    expect(lateSunday.tomorrow.toISOString()).toBe('2026-10-05T03:00:00.000Z');

    const monday = crmDayWindow(new Date('2026-10-05T03:30:00.000Z'));
    expect(monday.today.toISOString()).toBe('2026-10-05T03:00:00.000Z');
    expect(crmDayStartAfter(monday.today, 8).toISOString()).toBe('2026-10-13T03:00:00.000Z');
  });
});
