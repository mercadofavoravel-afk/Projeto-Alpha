import { describe, expect, it } from 'vitest';

import { createWhatsAppHref, getFollowUpMessage } from './whatsapp-follow-up';

describe('WhatsApp follow-up', () => {
  it('uses the suggested message saved in the CRM activity', () => {
    const message = getFollowUpMessage(
      'Follow-up programado: 3º dia.\nMensagem sugerida (não enviada automaticamente):\nOlá, Marina. Temos novas oportunidades em Ipanema.',
      'Marina',
      'Ipanema',
    );

    expect(message).toBe('Olá, Marina. Temos novas oportunidades em Ipanema.');
  });

  it('creates a WhatsApp link with country code and encoded message', () => {
    expect(createWhatsAppHref('(21) 96426-1042', 'Olá, Marina.')).toBe(
      'https://wa.me/5521964261042?text=Ol%C3%A1%2C%20Marina.',
    );
  });
});
