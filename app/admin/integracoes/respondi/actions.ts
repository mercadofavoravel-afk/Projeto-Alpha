'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { routingTransaction } from '@/lib/lead-routing';
import { respondiLandingSchema } from '@/lib/respondi-landing';

export async function saveRespondiLanding(formData: FormData) {
  const actor = await requireRole(['ADMIN', 'DIRECTOR']);
  const parsed = respondiLandingSchema.safeParse({
    formId: formData.get('formId'),
    name: formData.get('name'),
    pageUrl: formData.get('pageUrl'),
    neighborhood: formData.get('neighborhood'),
    enabled: formData.get('enabled') === 'true',
    fields: Object.fromEntries(
      ['name', 'phone', 'email', 'message', 'consent'].map((key) => [
        key,
        String(formData.get(`field_${key}`) || ''),
      ]),
    ),
  });
  if (!parsed.success) redirect('/admin/integracoes/respondi?result=invalid');
  const data = parsed.data;
  const saved = await routingTransaction(async (tx) => {
    if (await tx.articleLeadIntegration.findUnique({ where: { respondiFormId: data.formId } }))
      return false;
    const mapping = await tx.respondiLandingIntegration.upsert({
      where: { formId: data.formId },
      create: data,
      update: data,
    });
    await tx.auditLog.create({
      data: {
        action: 'respondi.landing_configured',
        entityType: 'RespondiLandingIntegration',
        entityId: mapping.id,
        userId: actor.id,
        metadata: { formId: data.formId, enabled: data.enabled, pageUrl: data.pageUrl },
      },
    });
    return true;
  });
  revalidatePath('/admin/integracoes');
  revalidatePath('/admin/integracoes/respondi');
  redirect(`/admin/integracoes/respondi?result=${saved ? 'saved' : 'conflict'}`);
}
