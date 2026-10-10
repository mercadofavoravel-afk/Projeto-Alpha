import 'server-only';

import { lookup } from 'node:dns/promises';
import { request } from 'node:https';
import { BlockList, isIP } from 'node:net';

import { customerArticleCta } from '@/lib/customer-intake';

const blocked = new BlockList();
for (const [address, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const)
  blocked.addSubnet(address, prefix, 'ipv4');

export function isPublicWordPressIPv4(address: string) {
  return isIP(address) === 4 && !blocked.check(address, 'ipv4');
}

export function normalizeWordPressSite(input: string) {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (
    url.protocol !== 'https:' ||
    url.port ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !host.includes('.') ||
    isIP(host) ||
    /(^|\.)(localhost|local|internal|test|invalid)$/i.test(host) ||
    input.length > 300
  )
    return null;
  // A WordPress install may live in a subdirectory; credentials never enter the URL.
  const pathname = url.pathname.replace(/\/+$/u, '');
  if (pathname.split('/').some((segment) => segment === '.' || segment === '..')) return null;
  return `${url.origin}${pathname}`;
}

export function isMatrixWordPressSite(siteUrl: string) {
  try {
    return (
      new URL(siteUrl).hostname.toLowerCase().replace(/^www\./u, '') ===
      'imoveisdealtopadraorio.com.br'
    );
  } catch {
    return false;
  }
}

export async function verifyWordPressEditor(
  siteUrl: string,
  username: string,
  appPassword: string,
) {
  const user = await wordPressJson(
    siteUrl,
    username,
    appPassword,
    '/wp-json/wp/v2/users/me?context=edit',
  );
  if (!user || typeof user !== 'object') return null;
  const identity = user as {
    id?: unknown;
    name?: unknown;
    capabilities?: { edit_posts?: unknown };
  };
  return Number.isSafeInteger(identity.id) && identity.capabilities?.edit_posts === true
    ? { id: identity.id as number, name: String(identity.name || username).slice(0, 120) }
    : null;
}

async function wordPressJson(
  siteUrl: string,
  username: string,
  appPassword: string,
  path: string,
  data?: Record<string, unknown>,
): Promise<unknown | null> {
  const normalized = normalizeWordPressSite(siteUrl);
  if (!normalized) return null;
  const url = new URL(`${normalized}${path}`);
  let records;
  try {
    records = await lookup(url.hostname, { all: true, family: 4 });
  } catch {
    return null;
  }
  // Pin a checked IPv4 address for the HTTPS request. Redirects are never followed.
  if (!records.length || records.some((record) => !isPublicWordPressIPv4(record.address)))
    return null;
  const address = records[0].address;
  const credential = Buffer.from(`${username}:${appPassword}`).toString('base64');
  const body = data ? JSON.stringify(data) : null;
  return new Promise<unknown | null>((resolve) => {
    const req = request(
      url,
      {
        method: body ? 'POST' : 'GET',
        headers: {
          Authorization: `Basic ${credential}`,
          Accept: 'application/json',
          ...(body
            ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
            : {}),
        },
        lookup: (_host, _options, callback) => callback(null, address, 4),
        timeout: 8000,
        maxHeaderSize: 16_384,
      },
      (response) => {
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          response.resume();
          resolve(null);
          return;
        }
        let text = '';
        response.setEncoding('utf8');
        response.on('data', (chunk: string) => {
          text += chunk;
          if (text.length > 524_288) {
            req.destroy();
            resolve(null);
          }
        });
        response.on('end', () => {
          try {
            resolve(JSON.parse(text));
          } catch {
            resolve(null);
          }
        });
        response.on('error', () => resolve(null));
      },
    );
    req.on('timeout', () => req.destroy());
    req.on('error', () => resolve(null));
    req.end(body ?? undefined);
  });
}

export async function writeWordPressPost(
  site: { siteUrl: string; wpUsername: string; applicationPassword: string },
  article: {
    id: string;
    wpPostId: number | null;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
  },
  status: 'draft' | 'publish',
) {
  // A remote post must be created as a draft before a separate publish action.
  if (status === 'publish' && !article.wpPostId) return null;
  const path = article.wpPostId
    ? `/wp-json/wp/v2/posts/${article.wpPostId}`
    : '/wp-json/wp/v2/posts';
  const payload = {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: `${article.content}\n\n${customerArticleCta(article.id)}`,
    status,
  };
  const response = await wordPressJson(
    site.siteUrl,
    site.wpUsername,
    site.applicationPassword,
    path,
    payload,
  );
  if (!response || typeof response !== 'object') return null;
  const post = response as { id?: unknown; status?: unknown; link?: unknown };
  if (
    !Number.isSafeInteger(post.id) ||
    post.status !== status ||
    (article.wpPostId && post.id !== article.wpPostId)
  )
    return null;
  let link: URL | null = null;
  try {
    if (typeof post.link === 'string') link = new URL(post.link);
  } catch {
    // A remote write may already have succeeded; keep its ID for reconciliation.
  }
  const siteHost = new URL(site.siteUrl).hostname;
  return {
    id: post.id as number,
    link: link?.protocol === 'https:' && link.hostname === siteHost ? link.href : null,
  };
}
