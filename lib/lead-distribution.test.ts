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
    expect(chooseAssignee(candidates, null)).toBeNull();
  });

  it('keeps general queues eligible for every neighborhood and unknown locations', () => {
    const general = { ...candidates[0], id: 'general', serviceRegions: [] };
    for (const region of ['Leblon', 'Gávea', 'Centro', null, '   ']) {
      expect(chooseAssignee([...candidates, general], region)?.id).toBe('general');
    }
    expect(candidateCanReceive({ ...general, activeLeadCount: 10 }, 'Centro')).toBe(false);
  });

  it('matches regional names without case or accent differences', () => {
    const regional = { ...candidates[0], serviceRegions: ['Gávea', 'Jardim Botânico'] };
    expect(candidateCanReceive(regional, ' gavea ')).toBe(true);
    expect(candidateCanReceive(regional, 'JARDIM BOTANICO')).toBe(true);
    expect(candidateCanReceive(regional, 'Ipanema')).toBe(false);
  });
});
