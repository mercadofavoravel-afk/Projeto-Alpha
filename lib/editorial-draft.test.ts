import { describe, expect, it } from 'vitest';

import { createEditorialDraft, isEditorialDraft } from './editorial-draft';

describe('editorial drafts', () => {
  it('creates a structured draft with only official contact destinations', () => {
    const draft = createEditorialDraft('Investir em Ipanema');

    expect(draft).toContain('Perguntas frequentes');
    expect(draft).toContain('https://www.imoveisdealtopadraorio.com.br');
    expect(draft).toContain('https://wa.me/5521964261042');
    expect([...draft.matchAll(/https?:\/\/\S+/g)].map((match) => match[0])).toEqual([
      'https://www.imoveisdealtopadraorio.com.br,',
      'https://wa.me/5521964261042',
    ]);
    expect(isEditorialDraft(draft)).toBe(true);
  });

  it('does not block content after the editorial marker is removed', () => {
    expect(isEditorialDraft('Conteúdo original pronto para revisão editorial.')).toBe(false);
  });
});
