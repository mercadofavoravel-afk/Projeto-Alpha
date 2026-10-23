import { describe, expect, it } from 'vitest';
import { defaultRespondiFields, respondiLandingSchema } from './respondi-landing';
import { parseRespondiLead } from './article-lead-integration';

const mapping = {
  formId: 'form123',
  name: 'Copacabana',
  neighborhood: 'Copacabana',
  pageUrl: 'https://imoveisdealtopadraorio.com.br/studios-copacabana/',
  fields: defaultRespondiFields,
  enabled: false,
};
describe('associação Respondi de página comercial', () => {
  it('rejects external destinations, credentials and ambiguous field mapping', () => {
    expect(respondiLandingSchema.safeParse(mapping).success).toBe(true);
    for (const pageUrl of [
      'https://evil.example/',
      'https://user:pass@imoveisdealtopadraorio.com.br/',
      'https://imoveisdealtopadraorio.com.br/?token=private',
    ])
      expect(respondiLandingSchema.safeParse({ ...mapping, pageUrl }).success).toBe(false);
    expect(
      respondiLandingSchema.safeParse({
        ...mapping,
        fields: { ...defaultRespondiFields, phone: defaultRespondiFields.name },
      }).success,
    ).toBe(false);
  });
  it('never guesses a required answer or grants consent from another question', () => {
    const payload = {
      form: { form_id: 'form123' },
      respondent: {
        respondent_id: 'respondent123',
        status: 'completed',
        answers: { Nome: 'Ana', WhatsApp: '21999999999', 'Outra pergunta': 'Sim' },
      },
    };
    expect(parseRespondiLead(payload)).toBeNull();
    expect(
      parseRespondiLead(payload, {
        name: 'Nome',
        phone: 'WhatsApp',
        email: '',
        message: '',
        consent: '',
      })?.consent,
    ).toBe(false);
  });
});
