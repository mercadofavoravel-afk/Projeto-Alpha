'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requirePermission } from '@/lib/auth';
import { getArticlePublicationIssues } from '@/lib/article-publication';
import { findInvalidEditorialDestinations } from '@/lib/editorial-destination';
import { createEditorialDraft, isEditorialDraft } from '@/lib/editorial-draft';
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
      content: createEditorialDraft(title),
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

  const current = await db.article.findUnique({
    where: {
      id,
    },
    select: {
      publishStatus: true,
      publishedAt: true,
      slug: true,
    },
  });

  if (!current) {
    redirect('/admin/artigos?erro=nao-encontrado');
  }

  if (publishStatus === 'PUBLISHED') {
    await requirePermission('catalog:publish');

    if (current.publishStatus !== 'REVIEW' && current.publishStatus !== 'PUBLISHED') {
      redirect(`/admin/artigos/${id}?erro=revisao`);
    }

    if (isEditorialDraft(content)) {
      redirect(`/admin/artigos/${id}?erro=rascunho`);
    }

    const publicationIssues = getArticlePublicationIssues({
      category: optional(formData, 'category') ?? '',
      content,
      excerpt: optional(formData, 'excerpt') ?? '',
      seoDescription: optional(formData, 'seoDescription') ?? '',
      seoTitle: optional(formData, 'seoTitle') ?? '',
      title,
    });

    if (publicationIssues.length > 0) {
      redirect(`/admin/artigos/${id}?erro=seo`);
    }

    const invalidDestinations = findInvalidEditorialDestinations(
      [
        title,
        content,
        String(formData.get('excerpt') ?? ''),
        String(formData.get('seoTitle') ?? ''),
        String(formData.get('seoDescription') ?? ''),
      ].join('\n'),
    );

    if (invalidDestinations.length > 0) {
      redirect(`/admin/artigos/${id}?erro=destinos`);
    }
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
