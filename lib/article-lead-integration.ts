import { z } from 'zod';

export const articleLeadIntegrationSchema = z
  .object({
    respondiFormId: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9_-]{4,80}$/)
      .nullable(),
    respondiUrl: z.string().trim().url().nullable(),
    tintimUrl: z.string().trim().url().nullable(),
  })
  .superRefine((value, context) => {
    if (value.respondiUrl) {
      const url = new URL(value.respondiUrl);
      if (
        url.protocol !== 'https:' ||
        url.hostname !== 'form.respondi.app' ||
        !url.pathname.slice(1)
      ) {
        context.addIssue({
          code: 'custom',
          path: ['respondiUrl'],
          message: 'Use a URL pública HTTPS de form.respondi.app.',
        });
      }
      if (!value.respondiFormId || url.pathname.split('/')[1] !== value.respondiFormId) {
        context.addIssue({
          code: 'custom',
          path: ['respondiFormId'],
          message: 'O ID deve coincidir com a URL do formulário.',
        });
      }
    }
    if (value.tintimUrl) {
      const url = new URL(value.tintimUrl);
      if (
        url.protocol !== 'https:' ||
        !(url.hostname === 'tintim.app' || url.hostname.endsWith('.tintim.app'))
      ) {
        context.addIssue({
          code: 'custom',
          path: ['tintimUrl'],
          message: 'Use um link HTTPS rastreável do Tintim.',
        });
      }
    }
  });

const payloadSchema = z.object({
  form: z.object({ form_id: z.string().min(4).max(80) }),
  respondent: z.object({
    respondent_id: z.string().min(4).max(120),
    status: z.literal('completed'),
    respondent_utms: z
      .object({
        utm_source: z.string().optional().nullable(),
        utm_medium: z.string().optional().nullable(),
        utm_campaign: z.string().optional().nullable(),
      })
      .optional(),
    answers: z.record(z.unknown()),
  }),
});

function answer(answers: Record<string, unknown>, key: string) {
  const value = answers[key];
  return typeof value === 'string' ? value.trim() : '';
}

// These exact questions are part of the Respondi catalogue template documented in docs.
// Unknown/partial answers never become a CRM lead.
export function parseRespondiLead(payload: unknown) {
  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) return null;
  const { form, respondent } = parsed.data;
  const name = answer(respondent.answers, 'Nome completo');
  const phone = answer(respondent.answers, 'Telefone / WhatsApp');
  const email = answer(respondent.answers, 'E-mail');
  if (
    name.length < 2 ||
    name.length > 120 ||
    phone.length < 8 ||
    phone.length > 30 ||
    (email && !z.string().email().safeParse(email).success)
  )
    return null;
  const consent =
    answer(respondent.answers, 'Autorizo o contato da Imóveis de Alto Padrão Rio').toLowerCase() ===
    'sim';
  return {
    formId: form.form_id,
    respondentId: respondent.respondent_id,
    name,
    phone,
    email: email || null,
    consent,
    message: answer(respondent.answers, 'O que procura?').slice(0, 2000) || null,
    utmSource: respondent.respondent_utms?.utm_source?.slice(0, 200) || null,
    utmMedium: respondent.respondent_utms?.utm_medium?.slice(0, 200) || null,
    utmCampaign: respondent.respondent_utms?.utm_campaign?.slice(0, 200) || null,
  };
}
