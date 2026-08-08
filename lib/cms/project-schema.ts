import { z } from 'zod';

export const projectEditorSchema = z
  .object({
    name: z.string().trim().min(3).max(160),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().trim().min(40),
    neighborhoodId: z.string().cuid(),
    developerId: z.string().cuid().nullable().optional(),
    publishStatus: z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED']),
    address: z.string().trim().max(240).nullable().optional(),
    heroImage: z.string().url().nullable().optional(),
    priceFrom: z.coerce.number().nonnegative().nullable().optional(),
    priceTo: z.coerce.number().nonnegative().nullable().optional(),
    areaFrom: z.coerce.number().nonnegative().nullable().optional(),
    areaTo: z.coerce.number().nonnegative().nullable().optional(),
    bedroomsFrom: z.coerce.number().int().nonnegative().nullable().optional(),
    bedroomsTo: z.coerce.number().int().nonnegative().nullable().optional(),
    suitesFrom: z.coerce.number().int().nonnegative().nullable().optional(),
    suitesTo: z.coerce.number().int().nonnegative().nullable().optional(),
    parkingFrom: z.coerce.number().int().nonnegative().nullable().optional(),
    parkingTo: z.coerce.number().int().nonnegative().nullable().optional(),
    seoTitle: z.string().trim().max(65).nullable().optional(),
    seoDescription: z.string().trim().max(160).nullable().optional(),
    featured: z.boolean().default(false),
  })
  .superRefine((value, context) => {
    const ranges = [
      ['priceFrom', 'priceTo'],
      ['areaFrom', 'areaTo'],
      ['bedroomsFrom', 'bedroomsTo'],
      ['suitesFrom', 'suitesTo'],
      ['parkingFrom', 'parkingTo'],
    ] as const;
    for (const [from, to] of ranges) {
      if (value[from] != null && value[to] != null && value[from]! > value[to]!) {
        context.addIssue({
          code: 'custom',
          path: [to],
          message: 'O valor máximo deve ser maior ou igual ao mínimo.',
        });
      }
    }
  });
