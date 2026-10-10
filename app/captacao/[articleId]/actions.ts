'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { assignableSubscriptionWhere } from '@/lib/commercial-subscription';
import { customerLeadInput } from '@/lib/customer-intake';
import { db } from '@/lib/db';

function result(articleId: string, status: string): never {
  redirect(`/captacao/${articleId}?resultado=${status}`);
}

export async function submitCustomerArticleLead(formData: FormData) {
  const articleId = String(formData.get('articleId') || '');
  if (!/^[a-z0-9]{20,40}$/u.test(articleId)) redirect('/artigos');

  // A bot filling this field gets the same confirmation without creating a contact.
  if (formData.get('website')) result(articleId, 'enviado');
  const parsed = customerLeadInput.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    objective: formData.get('objective'),
    typology: formData.get('typology'),
    message: formData.get('message'),
    consent: formData.get('consent') === 'true',
    utmSource: formData.get('utmSource'),
    utmMedium: formData.get('utmMedium'),
    utmCampaign: formData.get('utmCampaign'),
  });
  if (!parsed.success) result(articleId, 'invalido');

  // The article, connected site and subscription must still be active at submission.
  const article = await db.customerArticle.findFirst({
    where: {
      id: articleId,
      status: 'PUBLISHED',
      site: {
        owner: { isActive: true, ...assignableSubscriptionWhere() },
      },
    },
    select: { id: true, title: true, slug: true, siteId: true },
  });
  if (!article) result(articleId, 'indisponivel');

  try {
    await db.$transaction(
      async (tx) => {
        const recent = await tx.customerLead.count({
          where: {
            siteId: article.siteId,
            phone: parsed.data.phone,
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        });
        if (recent >= 5) return;
        const lead = await tx.customerLead.create({
          data: {
            siteId: article.siteId,
            articleId: article.id,
            name: parsed.data.name,
            phone: parsed.data.phone,
            email: parsed.data.email,
            objective: parsed.data.objective,
            typology: parsed.data.typology || null,
            message: parsed.data.message || null,
            consent: true,
            source: `Artigo WordPress: ${article.slug}`.slice(0, 200),
            utmSource: parsed.data.utmSource || null,
            utmMedium: parsed.data.utmMedium || null,
            utmCampaign: parsed.data.utmCampaign || null,
          },
        });
        await tx.customerLeadActivity.create({
          data: {
            leadId: lead.id,
            type: 'TASK',
            dueAt: lead.createdAt,
            note: `Primeiro atendimento pendente: interesse no artigo “${article.title}”.`,
          },
        });
        await tx.auditLog.create({
          data: {
            action: 'customer_lead.article_received',
            entityType: 'CustomerLead',
            entityId: lead.id,
            metadata: { siteId: article.siteId, articleId: article.id },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch {
    result(articleId, 'erro');
  }
  revalidatePath(`/admin/sites/${article.siteId}/leads`);
  result(articleId, 'enviado');
}
