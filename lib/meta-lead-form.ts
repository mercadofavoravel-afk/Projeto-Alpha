import { z } from 'zod';

const id = z.string().regex(/^\d{1,40}$/);

const notificationSchema = z.object({
  object: z.literal('page'),
  entry: z
    .array(
      z.object({
        id,
        changes: z.array(
          z.object({
            field: z.string(),
            value: z.object({
              leadgen_id: id.optional(),
              form_id: id.optional(),
              page_id: id.optional(),
              is_test: z.boolean().optional(),
            }),
          }),
        ),
      }),
    )
    .max(100),
});

const leadDetailSchema = z.object({
  id,
  field_data: z.array(z.object({ name: z.string(), values: z.array(z.string()) })).max(100),
  form_id: id.optional(),
});

export function parseMetaNotifications(payload: unknown) {
  const parsed = notificationSchema.safeParse(payload);
  if (!parsed.success) return null;
  return parsed.data.entry.flatMap((entry) =>
    entry.changes
      .filter((change) => change.field === 'leadgen' && change.value.leadgen_id)
      .map((change) => ({
        externalId: change.value.leadgen_id!,
        pageId: change.value.page_id || entry.id,
        formId: change.value.form_id || null,
        isTest: change.value.is_test === true,
      })),
  );
}

export function parseMetaLeadDetail(payload: unknown, expectedId: string) {
  const parsed = leadDetailSchema.safeParse(payload);
  if (!parsed.success || parsed.data.id !== expectedId) return null;

  const fields = new Map(
    parsed.data.field_data.map((field) => [
      field.name.toLowerCase(),
      field.values[0]?.trim() || '',
    ]),
  );
  const name = (
    fields.get('full_name') ||
    [fields.get('first_name'), fields.get('last_name')].filter(Boolean).join(' ')
  ).slice(0, 120);
  const phone = (fields.get('phone_number') || fields.get('phone') || '').slice(0, 30);
  if (name.length < 2 || phone.length < 8) return null;

  return {
    name,
    phone,
    email: (fields.get('email') || '').slice(0, 254) || null,
    neighborhood:
      (
        fields.get('preferred_location') ||
        fields.get('neighborhood') ||
        fields.get('bairro') ||
        ''
      ).slice(0, 120) || null,
    formId: parsed.data.form_id || null,
  };
}
