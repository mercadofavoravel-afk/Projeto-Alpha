'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requirePermission } from '@/lib/auth';
import { db } from '@/lib/db';
import { decryptMarketingToken } from '@/lib/marketing-oauth';
import { createSlug } from '@/lib/slug';
import { writeWordPressPost } from '@/lib/wordpress-site';

function base(siteId: string) {
  return `/admin/sites/${siteId}/artigos`;
}
function done(siteId: string, result: string): never {
  revalidatePath(base(siteId));
  redirect(`${base(siteId)}?result=${result}`);
}

export async function createSiteArticle(formData: FormData) {
  const user = await requirePermission('sites:manage');
  const siteId = String(formData.get('siteId') || '');
  const title = String(formData.get('title') || '').trim();
  const slug = createSlug(title);
  if (!slug || slug.length > 150 || title.length < 5 || title.length > 180) done(siteId, 'invalid');
  const site = await db.customerSite.findFirst({
    where: { id: siteId, ownerId: user.id },
    select: { id: true },
  });
  if (!site) done(siteId, 'missing');
  try {
    const article = await db.customerArticle.create({
      data: { siteId, title, slug, excerpt: '', content: '', seoTitle: '', seoDescription: '' },
    });
    revalidatePath(base(siteId));
    redirect(`${base(siteId)}/${article.id}`);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
      done(siteId, 'duplicate');
    throw error;
  }
}

export async function saveSiteArticle(formData: FormData) {
  const user = await requirePermission('sites:manage');
  const siteId = String(formData.get('siteId') || '');
  const id = String(formData.get('articleId') || '');
  const title = String(formData.get('title') || '').trim();
  const slug = createSlug(String(formData.get('slug') || ''));
  const content = String(formData.get('content') || '').trim();
  const excerpt = String(formData.get('excerpt') || '').trim();
  const seoTitle = String(formData.get('seoTitle') || '').trim();
  const seoDescription = String(formData.get('seoDescription') || '').trim();
  const review = formData.get('review') === 'true';
  if (
    !slug ||
    slug.length > 150 ||
    title.length < 5 ||
    title.length > 180 ||
    content.length > 100_000 ||
    excerpt.length > 320 ||
    seoTitle.length > 70 ||
    seoDescription.length > 160
  )
    done(siteId, 'invalid');
  if (review && (content.length < 500 || !excerpt || !seoTitle || !seoDescription))
    done(siteId, 'incomplete');
  const article = await db.customerArticle.findFirst({
    where: { id, siteId, site: { ownerId: user.id } },
    select: { id: true, status: true, wpPostId: true },
  });
  if (!article) done(siteId, 'missing');
  if (article.status === 'PUBLISHED') done(siteId, 'published');
  try {
    await db.customerArticle.update({
      where: { id },
      data: {
        title,
        slug,
        content,
        excerpt,
        seoTitle,
        seoDescription,
        status: review ? 'REVIEW' : 'DRAFT',
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
      done(siteId, 'duplicate');
    throw error;
  }
  revalidatePath(`${base(siteId)}/${id}`);
  done(siteId, 'saved');
}

export async function sendSiteArticle(formData: FormData) {
  const user = await requirePermission('sites:manage');
  const siteId = String(formData.get('siteId') || '');
  const articleId = String(formData.get('articleId') || '');
  const publish = formData.get('publish') === 'true';
  const article = await db.customerArticle.findFirst({
    where: { id: articleId, siteId, site: { ownerId: user.id } },
    include: { site: true },
  });
  if (!article) done(siteId, 'missing');
  if (article.status !== (publish ? 'REMOTE_DRAFT' : 'REVIEW')) done(siteId, 'review');
  if (
    article.content.length < 500 ||
    !article.excerpt ||
    !article.seoTitle ||
    !article.seoDescription
  )
    done(siteId, 'incomplete');
  let applicationPassword: string;
  try {
    applicationPassword = decryptMarketingToken(article.site.applicationPasswordEncrypted);
  } catch {
    done(siteId, 'configuration');
  }
  const sent = await writeWordPressPost(
    {
      siteUrl: article.site.siteUrl,
      wpUsername: article.site.wpUsername,
      applicationPassword,
    },
    article,
    publish ? 'publish' : 'draft',
  );
  if (!sent) done(siteId, 'remote');
  const updated = await db.customerArticle.updateMany({
    where: { id: article.id, siteId, status: article.status },
    data: {
      wpPostId: sent.id,
      publicUrl: publish ? sent.link : null,
      status: publish ? 'PUBLISHED' : 'REMOTE_DRAFT',
      publishedAt: publish ? new Date() : null,
    },
  });
  if (!updated.count) done(siteId, 'conflict');
  await db.auditLog.create({
    data: {
      action: publish ? 'customer_article.published' : 'customer_article.remote_draft',
      entityType: 'CustomerArticle',
      entityId: article.id,
      userId: user.id,
      metadata: { siteId, wpPostId: sent.id, url: sent.link },
    },
  });
  revalidatePath(`${base(siteId)}/${article.id}`);
  done(siteId, publish ? 'published' : 'remote-draft');
}
