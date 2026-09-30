import { describe, expect, it } from 'vitest';

import { completionFromAttempts, isOfficialDestination } from './content-calendar';

describe('content calendar', () => {
  it('accepts only internal or official destinations', () => {
    expect(isOfficialDestination('/artigos/ipanema')).toBe(true);
    expect(isOfficialDestination('https://imoveisdealtopadraorio.com.br/kronos-by-sigma/')).toBe(
      true,
    );
    expect(isOfficialDestination('https://blog.imoveisdealtopadraorio.com.br/artigo')).toBe(true);
    expect(isOfficialDestination('https://incorporadora.example/projeto')).toBe(false);
  });

  it('calculates publication completion per confirmed channel', () => {
    expect(completionFromAttempts(['PUBLISHED', 'READY', 'PENDING'])).toBe(33);
    expect(completionFromAttempts(['PUBLISHED', 'CANCELED'])).toBe(100);
    expect(completionFromAttempts([])).toBe(0);
  });
});
