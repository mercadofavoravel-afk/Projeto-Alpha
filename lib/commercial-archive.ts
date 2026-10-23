import { createHash } from 'node:crypto';

export { archiveKinds, archiveOrganizationLabel } from './commercial-archive-labels';

// Only tracking parameters are removed. Document IDs and meaningful query
// parameters remain part of identity, including Drive /file/d and ?id= URLs.
export function canonicalArchiveUrl(input: string): string {
  const url = new URL(input.trim());
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Informe um link HTTP ou HTTPS sem credenciais.');
  }
  url.hash = '';
  const folder =
    url.hostname === 'drive.google.com' ? url.pathname.match(/\/folders\/([^/]+)/)?.[1] : undefined;
  if (folder) url.pathname = `/drive/folders/${folder}`;
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith('utm_') || ['usp', 'sort', 'direction', 'fbclid', 'gclid'].includes(key)) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, '');
  return url.toString();
}

export function archiveUrlKey(url: string): string {
  return `url:${createHash('sha256').update(canonicalArchiveUrl(url)).digest('hex')}`;
}
