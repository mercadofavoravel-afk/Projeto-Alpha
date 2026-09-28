import { describe, expect, it } from 'vitest';

import { candidateCanReceive, chooseAssignee } from './lead-distribution';

const candidates = [
  {
    id: 'barra',
    activeLeadCount: 5,
    leadCapacity: 10,
    serviceRegions: ['Barra da Tijuca'],
    lastLeadAssignedAt: new Date('2026-09-28T10:00:00Z'),
  },
  {
    id: 'ipanema',
    activeLeadCount: 1,
    leadCapacity: 10,
    serviceRegions: ['Ipanema'],
    lastLeadAssignedAt: null,
  },
];

describe('lead distribution', () => {
  it('respects capacity and service region', () => {
    expect(candidateCanReceive(candidates[0], 'Barra da Tijuca')).toBe(true);
    expect(candidateCanReceive(candidates[0], 'Ipanema')).toBe(false);
    expect(candidateCanReceive({ ...candidates[0], activeLeadCount: 10 }, 'Barra da Tijuca')).toBe(
      false,
    );
  });

  it('chooses the least loaded eligible professional', () => {
    expect(chooseAssignee(candidates, 'Ipanema')?.id).toBe('ipanema');
    expect(chooseAssignee(candidates, 'Centro')).toBeNull();
    expect(chooseAssignee(candidates, null)?.id).toBe('ipanema');
  });
});
