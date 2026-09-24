import { describe, expect, it } from 'vitest';

import { createOrganicLeadSource, organicContentFromSource } from './lead-origin';

describe('createOrganicLeadSource', () => {
  it('keeps the content and region legible for CRM attribution', () => {
    expect(
      createOrganicLeadSource({
        content: '  Guia | investimento em Ipanema  ',
        region: ' Ipanema ',
      }),
    ).toBe('Orgânico | conteúdo: Guia / investimento em Ipanema | região: Ipanema');
  });

  it('preserves the region when the content is long', () => {
    const source = createOrganicLeadSource({
      content: 'Empreendimento '.repeat(20),
      region: 'Barra da Tijuca',
    });

    expect(source).toHaveLength(120);
    expect(source.endsWith(' | região: Barra da Tijuca')).toBe(true);
  });
});

describe('organicContentFromSource', () => {
  it('attributes current project and neighborhood forms and older article leads', () => {
    expect(
      organicContentFromSource(
        createOrganicLeadSource({ content: 'Empreendimento: Parque Studios', region: 'Ipanema' }),
      ),
    ).toBe('Empreendimento: Parque Studios');
    expect(organicContentFromSource('Orgânico | artigo: Guia de Ipanema | região: Ipanema')).toBe(
      'Guia de Ipanema',
    );
    expect(organicContentFromSource('Campanha: Google')).toBeNull();
  });
});
