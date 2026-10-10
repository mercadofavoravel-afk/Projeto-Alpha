'use server';

import type { LeadStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requirePermission } from '@/lib/auth';
import { db } from '@/lib/db';
import { contactTypes } from '@/lib/lead-risk';

const statuses: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'VISIT_SCHEDULED', 'WON', 'LOST'];
const validId = (value: string) => /^[a-z0-9]{20,40}$/u.test(value);

function done(siteId: string, leadId: string, result: string): never {
  if (!validId(siteId) || !validId(leadId)) redirect('/admin/sites');
  revalidatePath(`/admin/sites/${siteId}/leads`);
  redirect(`/admin/sites/${siteId}/leads/${leadId}?resultado=${result}`);
}

export async function updateCustomerLeadStatus(formData: FormData) {
  const user = await requirePermission('sites:manage');
  const siteId = String(formData.get('siteId') || '');
  const leadId = String(formData.get('leadId') || '');
  const status = String(formData.get('status') || '');
  if (!validId(siteId) || !validId(leadId) || !statuses.includes(status as LeadStatus))
    done(siteId, leadId, 'invalido');
  const updated = await db.$transaction(async (tx) => {
    const changed = await tx.customerLead.updateMany({
      where: { id: leadId, siteId, site: { ownerId: user.id } },
      data: { status: status as LeadStatus },
    });
    if (!changed.count) return false;
    await tx.customerLeadActivity.create({
      data: { leadId, type: 'STATUS_CHANGED', note: `Status alterado para ${status}.` },
    });
    await tx.auditLog.create({
      data: {
        action: 'customer_lead.status_changed',
        entityType: 'CustomerLead',
        entityId: leadId,
        userId: user.id,
        metadata: { siteId, status },
      },
    });
    return true;
  });
  done(siteId, leadId, updated ? 'salvo' : 'ausente');
}

export async function addCustomerLeadNote(formData: FormData) {
  const user = await requirePermission('sites:manage');
  const siteId = String(formData.get('siteId') || '');
  const leadId = String(formData.get('leadId') || '');
  const note = String(formData.get('note') || '').trim();
  const type = String(formData.get('type') || 'NOTE');
  if (
    !validId(siteId) ||
    !validId(leadId) ||
    note.length < 3 ||
    note.length > 2000 ||
    !['NOTE', ...contactTypes].includes(type)
  )
    done(siteId, leadId, 'invalido');
  const lead = await db.customerLead.findFirst({
    where: { id: leadId, siteId, site: { ownerId: user.id } },
    select: { id: true },
  });
  if (!lead) done(siteId, leadId, 'ausente');
  await db.$transaction([
    db.customerLeadActivity.create({
      data: {
        leadId,
        type,
        note,
        completedAt: contactTypes.includes(type) ? new Date() : null,
      },
    }),
    db.auditLog.create({
      data: {
        action: 'customer_lead.activity_added',
        entityType: 'CustomerLead',
        entityId: leadId,
        userId: user.id,
        metadata: { siteId, type },
      },
    }),
  ]);
  done(siteId, leadId, 'salvo');
}

export async function completeCustomerLeadActivity(formData: FormData) {
  const user = await requirePermission('sites:manage');
  const siteId = String(formData.get('siteId') || '');
  const leadId = String(formData.get('leadId') || '');
  const activityId = String(formData.get('activityId') || '');
  if (!validId(siteId) || !validId(leadId) || !validId(activityId))
    done(siteId, leadId, 'invalido');
  const updated = await db.customerLeadActivity.updateMany({
    where: {
      id: activityId,
      leadId,
      completedAt: null,
      lead: { siteId, site: { ownerId: user.id } },
    },
    data: { completedAt: new Date() },
  });
  done(siteId, leadId, updated.count ? 'salvo' : 'ausente');
}
