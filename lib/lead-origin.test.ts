import { describe, expect, it } from 'vitest';

import { contentFromSource, createContentLeadSource, isArticleSource } from './lead-origin';

describe('createContentLeadSource', () => {
  it('keeps the content and region legible for CRM attribution', () => {
    expect(
      createContentLeadSource({
        content: '  Guia | investimento em Ipanema  ',
        region: ' Ipanema ',
      }),
    ).toBe('Conteúdo | conteúdo: Guia / investimento em Ipanema | região: Ipanema');
  });

  it('preserves the region when the content is long', () => {
    const source = createContentLeadSource({
      content: 'Empreendimento '.repeat(20),
      region: 'Barra da Tijuca',
    });

    expect(source).toHaveLength(120);
    expect(source.endsWith(' | região: Barra da Tijuca')).toBe(true);
  });
});

describe('contentFromSource', () => {
  it('attributes current project and neighborhood forms and older article leads', () => {
    expect(
      contentFromSource(
        createContentLeadSource({ content: 'Empreendimento: Parque Studios', region: 'Ipanema' }),
      ),
    ).toBe('Empreendimento: Parque Studios');
    expect(contentFromSource('Orgânico | artigo: Guia de Ipanema | região: Ipanema')).toBe(
      'Guia de Ipanema',
    );
    expect(contentFromSource('Conteúdo | artigo: Guia novo | região: Leblon')).toBe('Guia novo');
    expect(contentFromSource('Campanha: Google')).toBeNull();
    expect(isArticleSource('Orgânico | artigo: Guia antigo')).toBe(true);
    expect(isArticleSource('Conteúdo | artigo: Guia novo')).toBe(true);
    expect(isArticleSource('Conteúdo | conteúdo: Bairro')).toBe(false);
  });
});
