import { describe, expect, it } from 'vitest';

import { createOrganicLeadSource } from './lead-origin';

describe('createOrganicLeadSource', () => {
  it('keeps the content and region legible for CRM attribution', () => {
    expect(
      createOrganicLeadSource({
        content: '  Guia | investimento em Ipanema  ',
        region: ' Ipanema ',
      }),
    ).toBe(
      'Orgânico | conteúdo: Guia / investimento em Ipanema | região: Ipanema',
    );
  });

  it('preserves the region when the content is long', () => {
    const source = createOrganicLeadSource({
      content: 'Empreendimento '.repeat(20),
      region: 'Barra da Tijuca',
    });

    expect(source).toHaveLength(120);
    expect(source).toEndWith(' | região: Barra da Tijuca');
  });
});
