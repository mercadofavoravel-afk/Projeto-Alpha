import { describe, expect, it } from 'vitest';

import { summarizeUnassignedCoverage } from './lead-coverage';

const candidates = [
  {
    id: 'barra',
    activeLeadCount: 3,
    leadCapacity: 30,
    serviceRegions: ['Barra da Tijuca'],
    lastLeadAssignedAt: null,
  },
];

describe('summarizeUnassignedCoverage', () => {
  it('shows a region without an eligible professional before covered regions', () => {
    const summary = summarizeUnassignedCoverage(
      [
        {
          neighborhood: 'Barra da Tijuca',
          _count: { _all: 2 },
          _min: { createdAt: new Date('2026-10-01T12:00:00Z') },
        },
        {
          neighborhood: 'Leblon',
          _count: { _all: 1 },
          _min: { createdAt: new Date('2026-08-13T12:00:00Z') },
        },
      ],
      candidates,
    );

    expect(summary.total).toBe(3);
    expect(summary.withoutCoverage).toBe(1);
    expect(summary.regions[0]).toMatchObject({ region: 'Leblon', availableProfessionals: 0 });
    expect(summary.regions[1]).toMatchObject({
      region: 'Barra da Tijuca',
      availableProfessionals: 1,
      freeCapacity: 27,
    });
  });

  it('does not count a professional whose active load reached capacity', () => {
    const summary = summarizeUnassignedCoverage(
      [{ neighborhood: 'Barra da Tijuca', _count: { _all: 1 }, _min: { createdAt: null } }],
      [{ ...candidates[0], activeLeadCount: 30 }],
    );
    expect(summary.withoutCoverage).toBe(1);
    expect(summary.regions[0].freeCapacity).toBe(0);
  });
});
