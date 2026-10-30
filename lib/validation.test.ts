import { describe, expect, it } from 'vitest';
import { leadSchema } from './validation';

const contact = { name: 'Comprador', phone: '+55 21 99999-9999', consent: true };

describe('first commercial contact', () => {
  it('accepts name and telephone without requiring email or a known typology', () => {
    expect(leadSchema.safeParse(contact).success).toBe(true);
    expect(leadSchema.safeParse({ ...contact, email: '' }).success).toBe(true);
  });

  it('still rejects malformed email, missing consent and missing telephone', () => {
    expect(leadSchema.safeParse({ ...contact, email: 'invalid' }).success).toBe(false);
    expect(leadSchema.safeParse({ ...contact, consent: false }).success).toBe(false);
    expect(leadSchema.safeParse({ ...contact, phone: '' }).success).toBe(false);
  });

  it('retains article and paid attribution when optional qualification is omitted', () => {
    const result = leadSchema.parse({ ...contact, articleSlug: 'imovel-barra', utmSource: 'google', utmMedium: 'cpc' });
    expect(result.articleSlug).toBe('imovel-barra');
    expect(result.utmMedium).toBe('cpc');
  });
});
