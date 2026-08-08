import { z } from 'zod';
export const recommendationSchema = z.object({
  objective: z.enum(['LIVE', 'INVEST', 'PATRIMONY', 'SELL', 'RENT', 'OTHER']).default('OTHER'),
  preferredBairros: z.array(z.string()).max(10).default([]),
  preferredTypes: z.array(z.string()).max(10).default([]),
  budgetMax: z.coerce.number().positive().optional(),
  areaMin: z.coerce.number().nonnegative().optional(),
  bedroomsMin: z.coerce.number().int().nonnegative().optional(),
  suitesMin: z.coerce.number().int().nonnegative().optional(),
  parkingMin: z.coerce.number().int().nonnegative().optional(),
  proximityBeach: z.coerce.number().int().min(0).max(5).default(0),
  proximityMetro: z.coerce.number().int().min(0).max(5).default(0),
  investmentFocus: z.coerce.number().int().min(0).max(5).default(0),
  lifestyleFocus: z.coerce.number().int().min(0).max(5).default(0),
  sessionKey: z.string().min(8).max(120).optional(),
});
