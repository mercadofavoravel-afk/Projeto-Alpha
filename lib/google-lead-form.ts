import { z } from 'zod';

const text = z.string().trim();
const googleLeadSchema = z.object({
  lead_id: text.min(1).max(200),
  google_key: text.min(1),
  is_test: z.boolean().optional(),
  form_id: z.union([z.string(), z.number()]).optional(),
  campaign_id: z.union([z.string(), z.number()]).optional(),
  user_column_data: z.array(z.object({ column_id: text, string_value: text })).max(100),
});

export function parseGoogleLeadForm(payload: unknown) {
  const parsed = googleLeadSchema.safeParse(payload);
  if (!parsed.success) return null;

  const fields = new Map(
    parsed.data.user_column_data.map((field) => [field.column_id, field.string_value]),
  );
  const name = (
    fields.get('FULL_NAME') ||
    [fields.get('FIRST_NAME'), fields.get('LAST_NAME')].filter(Boolean).join(' ')
  ).slice(0, 120);
  const phone = (fields.get('PHONE_NUMBER') || fields.get('WORK_PHONE') || '').slice(0, 30);
  if (name.length < 2 || phone.length < 8) return null;

  return {
    externalId: parsed.data.lead_id,
    key: parsed.data.google_key,
    isTest: parsed.data.is_test === true,
    name,
    phone,
    email: (fields.get('EMAIL') || fields.get('WORK_EMAIL') || '').slice(0, 254) || null,
    neighborhood:
      (fields.get('PROPERTY_COMMUNITY') || fields.get('PREFERRED_LOCATION') || '').slice(0, 120) ||
      null,
    formId: parsed.data.form_id?.toString() || null,
    campaignId: parsed.data.campaign_id?.toString() || null,
  };
}
