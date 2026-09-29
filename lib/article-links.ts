import { isPublicSiteUrl } from './public-destination';

export type ArticleSegment = { text: string; href?: string };
export type ArticleBlock = {
  kind: 'paragraph' | 'heading' | 'subheading' | 'list' | 'ordered-list';
  lines: string[];
};

export function articleContentBlocks(content: string): ArticleBlock[] {
  return content
    .split(/\n\s*\n/u)
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((part): ArticleBlock[] => {
      const lines = part.split(/\n/u).map((line) => line.trim());
      if (lines.every((line) => /^-\s+/u.test(line))) {
        return [{ kind: 'list', lines: lines.map((line) => line.replace(/^-\s+/u, '')) }];
      }
      if (lines.every((line) => /^\d+\.\s+/u.test(line))) {
        return [
          { kind: 'ordered-list', lines: lines.map((line) => line.replace(/^\d+\.\s+/u, '')) },
        ];
      }
      const match = part.match(/^(#{2,3})\s+([^\n]+)$/u);
      if (match) {
        return [{ kind: match[1] === '##' ? 'heading' : 'subheading', lines: [match[2]] }];
      }
      return [{ kind: 'paragraph', lines: [lines.join(' ')] }];
    });
}

// Articles are saved as plain text. Convert links to the official site into
// anchors without interpreting user-supplied HTML or linking to other domains.
export function articleContentSegments(paragraph: string): ArticleSegment[] {
  const segments: ArticleSegment[] = [];
  const urls = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>"')\]]+)/giu;
  let cursor = 0;

  for (const match of paragraph.matchAll(urls)) {
    const index = match.index ?? 0;
    if (index > cursor) segments.push({ text: paragraph.slice(cursor, index) });

    const full = match[0];
    const markdownLabel = match[1];
    const href = (match[2] ?? match[3]).replace(/[.,;:!?]+$/u, '');
    const punctuation = markdownLabel ? '' : full.slice(href.length);

    if (isPublicSiteUrl(href)) {
      segments.push({ text: markdownLabel ?? href, href });
    } else {
      segments.push({ text: markdownLabel ? `${markdownLabel} (${href})` : href });
    }

    if (punctuation) segments.push({ text: punctuation });
    cursor = index + full.length;
  }

  if (cursor < paragraph.length) segments.push({ text: paragraph.slice(cursor) });
  return segments;
}
