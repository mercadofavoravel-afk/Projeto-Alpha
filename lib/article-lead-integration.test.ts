import { describe, expect, it } from 'vitest';

import { articleLeadIntegrationSchema, parseRespondiLead } from './article-lead-integration';

const payload = {
  form: { form_id: 'abc123' },
  respondent: {
    respondent_id: 'response-01',
    status: 'completed',
    respondent_utms: { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'leblon' },
    answers: {
      'Nome completo': 'Ana Silva',
      'Telefone / WhatsApp': '21999999999',
      'E-mail': 'ana@example.com',
      'Autorizo o contato da Imóveis de Alto Padrão Rio': 'Sim',
    },
  },
};

describe('catálogo e resposta Respondi', () => {
  it('aceita somente URL do formulário que coincide com o ID', () => {
    expect(
      articleLeadIntegrationSchema.safeParse({
        respondiFormId: 'abc123',
        respondiUrl: 'https://form.respondi.app/abc123',
        tintimUrl: null,
      }).success,
    ).toBe(true);
    expect(
      articleLeadIntegrationSchema.safeParse({
        respondiFormId: 'abc123',
        respondiUrl: 'https://evil.example/abc123',
        tintimUrl: null,
      }).success,
    ).toBe(false);
    expect(
      articleLeadIntegrationSchema.safeParse({
        respondiFormId: 'abc123',
        respondiUrl: 'https://form.respondi.app/other',
        tintimUrl: null,
      }).success,
    ).toBe(false);
  });

  it('extrai resposta completa e consentimento explícito', () => {
    expect(parseRespondiLead(payload)).toMatchObject({
      name: 'Ana Silva',
      phone: '21999999999',
      consent: true,
      utmSource: 'google',
    });
    expect(
      parseRespondiLead({ ...payload, respondent: { ...payload.respondent, status: 'started' } }),
    ).toBeNull();
    expect(
      parseRespondiLead({ ...payload, respondent: { ...payload.respondent, answers: {} } }),
    ).toBeNull();
    expect(
      parseRespondiLead({
        ...payload,
        respondent: {
          ...payload.respondent,
          answers: {
            ...payload.respondent.answers,
            'Autorizo o contato da Imóveis de Alto Padrão Rio': 'Não',
          },
        },
      }),
    ).toMatchObject({ consent: false });
  });
});
