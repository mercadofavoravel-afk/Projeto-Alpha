import { organicContentFromSource } from './lead-origin';

type LeadArticleOrigin = { articleSlug: string | null; source: string | null };

// The slug survives title edits and source truncation. Older leads retain their source label.
export function summarizeArticleLeads(leads: LeadArticleOrigin[]) {
  const counts = new Map<string, { slug: string | null; label: string; count: number }>();

  for (const lead of leads) {
    const slug = lead.articleSlug?.trim() || null;
    const label = slug || organicContentFromSource(lead.source);
    if (!label) continue;
    const key = slug ? `slug:${slug}` : `legacy:${label}`;
    const current = counts.get(key);
    if (current) current.count += 1;
    else counts.set(key, { slug, label, count: 1 });
  }

  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'pt-BR'))
    .slice(0, 10);
}
