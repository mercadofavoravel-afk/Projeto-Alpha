import { z } from 'zod';

/** An empty stored list means the general queue; existing registrations keep that meaning. */
export const leadRoutingSettingsSchema = z
  .object({
    scope: z.enum(['ALL', 'REGIONAL']),
    regions: z.string().max(2500),
  })
  .transform(({ scope, regions }, context) => {
    if (scope === 'ALL') return [];
    const unique = new Map<string, string>();
    for (const region of regions.split(',')) {
      const value = region.trim();
      if (!value) continue;
      const key = value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('pt-BR');
      if (!unique.has(key)) unique.set(key, value);
    }
    const result = z
      .array(z.string().min(2).max(80))
      .min(1)
      .max(30)
      .safeParse([...unique.values()]);
    if (!result.success) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe de 1 a 30 bairros válidos para a fila regional.',
      });
      return z.NEVER;
    }
    return result.data;
  });
