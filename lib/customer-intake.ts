import { z } from 'zod';

import { buildCanonical } from '@/lib/seo/canonical';

export const customerLeadInput = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s().-]{8,30}$/u),
  email: z.string().trim().email().max(254),
  objective: z.enum(['LIVE', 'INVEST', 'PATRIMONY', 'SELL', 'RENT', 'OTHER']),
  typology: z.string().trim().max(120),
  message: z.string().trim().max(2000),
  consent: z.literal(true),
  utmSource: z.string().trim().max(200),
  utmMedium: z.string().trim().max(200),
  utmCampaign: z.string().trim().max(200),
});

export function customerArticleCaptureUrl(articleId: string) {
  if (!/^[a-z0-9]{20,40}$/u.test(articleId)) throw new Error('Artigo inválido.');
  return buildCanonical(`/captacao/${articleId}`);
}

export function customerArticleCta(articleId: string) {
  const url = customerArticleCaptureUrl(articleId);
  return `<p><a href="${url}">Solicite atendimento sobre este artigo pelo formulário seguro</a></p>`;
}
