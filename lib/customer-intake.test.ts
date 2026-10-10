import { describe, expect, it, vi } from 'vitest';

import {
  customerArticleCaptureUrl,
  customerArticleCta,
  customerLeadInput,
} from './customer-intake';

describe('captura separada por artigo do cliente', () => {
  it('vincula o CTA a um artigo específico no endereço público do Alpha', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://imoveisdealtopadraorio.com.br');
    vi.stubEnv('NEXT_PUBLIC_ALPHA_BASE_PATH', '/alpha');
    const id = 'cm12345678901234567890';
    expect(customerArticleCaptureUrl(id)).toBe(
      'https://imoveisdealtopadraorio.com.br/alpha/captacao/cm12345678901234567890',
    );
    expect(customerArticleCta(id)).toContain(`href="${customerArticleCaptureUrl(id)}"`);
    expect(() => customerArticleCta('invalid" onclick="alert(1)')).toThrow();
    vi.unstubAllEnvs();
  });

  it('rejeita contato sem consentimento ou com dados fora dos limites', () => {
    const input = {
      name: 'Maria Silva',
      phone: '21999999999',
      email: 'maria@example.com',
      message: '',
      consent: true,
      objective: 'LIVE',
      typology: '',
      utmSource: '',
      utmMedium: '',
      utmCampaign: '',
    };
    expect(customerLeadInput.safeParse(input).success).toBe(true);
    expect(customerLeadInput.safeParse({ ...input, consent: false }).success).toBe(false);
    expect(customerLeadInput.safeParse({ ...input, message: 'x'.repeat(2001) }).success).toBe(
      false,
    );
  });
});
