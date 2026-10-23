import { describe, expect, it } from 'vitest';
import { archiveUrlKey, canonicalArchiveUrl } from './commercial-archive';

describe('commercial archive identity', () => {
  it('deduplicates alternate Drive folder URLs and tracking without merging distinct files', () => {
    expect(
      archiveUrlKey(
        'https://drive.google.com/drive/u/0/mobile/folders/folderA?usp=sharing&sort=13',
      ),
    ).toBe(archiveUrlKey('https://drive.google.com/drive/folders/folderA'));
    expect(archiveUrlKey('https://example.com/book?id=a&utm_source=whatsapp')).not.toBe(
      archiveUrlKey('https://example.com/book?id=b'),
    );
    expect(canonicalArchiveUrl('https://example.com/a/?utm_campaign=x#top')).toBe(
      'https://example.com/a',
    );
  });
  it('rejects executable URLs and embedded credentials', () => {
    for (const value of [
      'javascript:alert(1)',
      'data:text/html,test',
      'https://user:pass@example.com',
    ]) {
      expect(() => canonicalArchiveUrl(value)).toThrow();
    }
  });
});
