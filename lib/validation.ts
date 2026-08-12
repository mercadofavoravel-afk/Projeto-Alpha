import { z } from 'zod';

export const leadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(30),
  email: z.string().email().optional().or(z.literal('')),
  objective: z
    .enum(['LIVE', 'INVEST', 'PATRIMONY', 'SELL', 'RENT', 'OTHER'])
    .default('OTHER'),
  neighborhood: z.string().trim().max(120).optional(),
  budgetMin: z.coerce.number().nonnegative().optional(),
  budgetMax: z.coerce.number().nonnegative().optional(),
  message: z.string().trim().max(2000).optional(),
  source: z.string().trim().max(120).optional(),
  utmSource: z.string().trim().max(200).optional(),
  utmMedium: z.string().trim().max(200).optional(),
  utmCampaign: z.string().trim().max(200).optional(),
  consent: z.literal(true),
});

export const projectSchema = z.object({
  name: z.string().trim().min(2).max(180),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(180)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().trim().min(20),
  neighborhoodId: z.string().cuid(),
  statusLabel: z.string().trim().max(120).optional(),
  heroImage: z.string().trim().optional(),
  sourceUrl: z.string().url().optional().or(z.literal('')),
  featured: z.boolean().default(false),
});
