import { z } from 'zod';
import { isPublicSiteUrl } from './public-destination';

export const respondiFieldsSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    phone: z.string().trim().min(1).max(200),
    email: z.string().trim().max(200),
    message: z.string().trim().max(200),
    consent: z.string().trim().max(200),
  })
  .superRefine((fields, context) => {
    const labels = Object.values(fields).filter(Boolean);
    if (new Set(labels).size !== labels.length)
      context.addIssue({
        code: 'custom',
        message: 'Cada campo precisa de uma pergunta diferente.',
      });
  });

export type RespondiFields = z.infer<typeof respondiFieldsSchema>;
export const defaultRespondiFields: RespondiFields = {
  name: 'Nome completo',
  phone: 'Telefone / WhatsApp',
  email: 'E-mail',
  message: 'O que procura?',
  consent: 'Autorizo o contato da Imóveis de Alto Padrão Rio',
};

export const respondiLandingSchema = z.object({
  formId: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{4,80}$/),
  name: z.string().trim().min(2).max(100),
  pageUrl: z
    .string()
    .trim()
    .url()
    .max(2000)
    .refine((value) => {
      if (!isPublicSiteUrl(value)) return false;
      const url = new URL(value);
      return (
        url.protocol === 'https:' &&
        !url.username &&
        !url.password &&
        !url.search &&
        !url.hash &&
        !url.pathname.startsWith('/alpha/admin')
      );
    }, 'Use a URL pública da página no domínio oficial, sem parâmetros.'),
  neighborhood: z.string().trim().min(2).max(80),
  fields: respondiFieldsSchema,
  enabled: z.boolean(),
});
