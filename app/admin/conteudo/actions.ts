'use server';

import type {
  ContentPlanStatus,
  PublicationChannel,
  PublicationStatus,
} from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requirePermission } from '@/lib/auth';
import {
  contentPlanStatuses,
  isOfficialDestination,
  publicationChannels,
  publicationStatuses,
} from '@/lib/content-calendar';
import { db } from '@/lib/db';

function optional(formData: FormData, field: string) {
  const value = String(formData.get(field) ?? '').trim();
  return value || null;
}

function selectedChannels(formData: FormData) {
  const values = formData
    .getAll('channels')
    .map(String)
    .filter((channel): channel is PublicationChannel =>
      publicationChannels.includes(channel as PublicationChannel),
    );

  return [...new Set(values)];
}

function parseRioDateTime(value: string) {
  const normalized = value.length === 16 ? `${value}:00` : value;
  const date = new Date(`${normalized}-03:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function createContentPlanAction(formData: FormData) {
  const user = await requirePermission('catalog:write');
  const title = String(formData.get('title') ?? '').trim();
  const contentType = String(formData.get('contentType') ?? '').trim();
  const cta = String(formData.get('cta') ?? '').trim();
  const destinationUrl = String(formData.get('destinationUrl') ?? '').trim();
  const scheduledAt = parseRioDateTime(String(formData.get('scheduledAt') ?? '').trim());
  const channels = selectedChannels(formData);

  if (
    title.length < 5 ||
    contentType.length < 3 ||
    cta.length < 10 ||
    !scheduledAt ||
    channels.length === 0
  ) {
    redirect('/admin/conteudo?erro=campos');
  }

  if (!isOfficialDestination(destinationUrl)) {
    redirect('/admin/conteudo?erro=destino');
  }

  const articleId = optional(formData, 'articleId');
  if (articleId) {
    const article = await db.article.findUnique({ where: { id: articleId }, select: { id: true } });
    if (!article) redirect('/admin/conteudo?erro=artigo');
  }

  await db.contentPlan.create({
    data: {
      title,
      contentType,
      topic: optional(formData, 'topic'),
      targetAudience: optional(formData, 'targetAudience'),
      region: optional(formData, 'region'),
      projectName: optional(formData, 'projectName'),
      caption: optional(formData, 'caption'),
      cta,
      destinationUrl,
      assetUrl: optional(formData, 'assetUrl'),
      scheduledAt,
      status: 'DRAFT',
      articleId,
      createdById: user.id,
      publications: {
        create: channels.map((channel) => ({ channel, status: 'PENDING' })),
      },
    },
  });

  revalidatePath('/admin');
  revalidatePath('/admin/conteudo');
  redirect('/admin/conteudo?criado=1');
}

export async function updateContentPlanStatusAction(formData: FormData) {
  await requirePermission('catalog:write');
  const id = String(formData.get('id') ?? '').trim();
  const value = String(formData.get('status') ?? '').trim() as ContentPlanStatus;

  if (!id || !contentPlanStatuses.includes(value)) redirect('/admin/conteudo?erro=status');

  await db.contentPlan.update({ where: { id }, data: { status: value } });
  revalidatePath('/admin');
  revalidatePath('/admin/conteudo');
}

export async function updatePublicationAction(formData: FormData) {
  await requirePermission('catalog:write');
  const id = String(formData.get('id') ?? '').trim();
  const value = String(formData.get('status') ?? '').trim() as PublicationStatus;
  const externalUrl = optional(formData, 'externalUrl');

  if (!id || !publicationStatuses.includes(value)) redirect('/admin/conteudo?erro=canal');
  if (value === 'PUBLISHED' && !externalUrl) redirect('/admin/conteudo?erro=confirmacao');

  await db.publicationAttempt.update({
    where: { id },
    data: {
      status: value,
      externalUrl,
      errorMessage: value === 'FAILED' ? optional(formData, 'errorMessage') : null,
      publishedAt: value === 'PUBLISHED' ? new Date() : null,
    },
  });

  revalidatePath('/admin');
  revalidatePath('/admin/conteudo');
}
