'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requirePermission } from '@/lib/auth';
import { db } from '@/lib/db';
import { createSlug } from '@/lib/slug';

const publishStatuses = ['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'] as const;

type PublishStatusValue = (typeof publishStatuses)[number];

function optional(formData: FormData, field: string) {
  const value = String(formData.get(field) ?? '').trim();

  return value || null;
}

function getPublishStatus(formData: FormData): PublishStatusValue {
  const value = String(formData.get('publishStatus') ?? 'DRAFT');

  return publishStatuses.includes(value as PublishStatusValue)
    ? (value as PublishStatusValue)
    : 'DRAFT';
}

async function uniqueSlug(value: string, articleId?: string) {
  const baseSlug = createSlug(value);

  if (!baseSlug) {
    throw new Error('Informe um título que possa virar uma URL.');
  }

  let slug = baseSlug;
  let index = 2;

  while (true) {
    const existing = await db.article.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (!existing || existing.id === articleId) {
      return slug;
    }

    slug = `${baseSlug}-${index}`;
    index += 1;
  }
}

function revalidateArticlePaths(slug: string) {
  revalidatePath('/admin/artigos');
  revalidatePath('/artigos');
  revalidatePath(`/artigos/${slug}`);
  revalidatePath('/sitemap.xml');
}

export async function createArticleAction(formData: FormData) {
  await requirePermission('catalog:write');

  const title = String(formData.get('title') ?? '').trim();

  if (title.length < 5) {
    redirect('/admin/artigos?erro=titulo');
  }

  const slug = await uniqueSlug(title);

  const article = await db.article.create({
    data: {
      title,
      slug,
      content: '',
      publishStatus: 'DRAFT',
    },
  });

  revalidateArticlePaths(article.slug);
  redirect(`/admin/artigos/${article.id}?criado=1`);
}

export async function saveArticleAction(formData: FormData) {
  await requirePermission('catalog:write');

  const id = String(formData.get('id') ?? '').trim();
  const title = String(formData.get('title') ?? '').trim();
  const content = String(formData.get('content') ?? '').trim();
  const publishStatus = getPublishStatus(formData);

  if (!id || title.length < 5 || content.length < 50) {
    redirect(`/admin/artigos/${id}?erro=campos`);
  }

  if (publishStatus === 'PUBLISHED') {
    await requirePermission('catalog:publish');
  }

  const current = await db.article.findUnique({
    where: {
      id,
    },
    select: {
      publishedAt: true,
      slug: true,
    },
  });

  if (!current) {
    redirect('/admin/artigos?erro=nao-encontrado');
  }

  const slug = await uniqueSlug(String(formData.get('slug') ?? title).trim() || title, id);

  const article = await db.article.update({
    where: {
      id,
    },
    data: {
      slug,
      title,
      excerpt: optional(formData, 'excerpt'),
      content,
      heroImage: optional(formData, 'heroImage'),
      category: optional(formData, 'category'),
      seoTitle: optional(formData, 'seoTitle'),
      seoDescription: optional(formData, 'seoDescription'),
      publishStatus,
      publishedAt: publishStatus === 'PUBLISHED' ? (current.publishedAt ?? new Date()) : null,
    },
  });

  revalidateArticlePaths(current.slug);
  revalidateArticlePaths(article.slug);
  redirect(`/admin/artigos/${article.id}?salvo=1`);
}
