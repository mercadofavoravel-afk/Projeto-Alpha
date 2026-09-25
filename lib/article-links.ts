import { isPublicSiteUrl } from './public-destination';

export type ArticleSegment = { text: string; href?: string };

// Articles are saved as plain text. Convert links to the official site into
// anchors without interpreting user-supplied HTML or linking to other domains.
export function articleContentSegments(paragraph: string): ArticleSegment[] {
  const segments: ArticleSegment[] = [];
  const urls = /https?:\/\/[^\s<>"')\]]+/giu;
  let cursor = 0;

  for (const match of paragraph.matchAll(urls)) {
    const index = match.index ?? 0;
    if (index > cursor) segments.push({ text: paragraph.slice(cursor, index) });

    const full = match[0];
    const href = full.replace(/[.,;:!?]+$/u, '');
    const punctuation = full.slice(href.length);

    if (isPublicSiteUrl(href)) {
      segments.push({ text: href, href });
    } else {
      segments.push({ text: href });
    }

    if (punctuation) segments.push({ text: punctuation });
    cursor = index + full.length;
  }

  if (cursor < paragraph.length) segments.push({ text: paragraph.slice(cursor) });
  return segments;
}
