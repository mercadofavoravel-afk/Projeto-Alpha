import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  isGoogleDriveGatewayUrl,
  isGoogleWorkspaceDocumentUrl,
  isSameNormalizedUrl,
} from './source-url';

describe('source URL helpers', () => {
  it('recognizes native Google Workspace documents', () => {
    expect(
      isGoogleWorkspaceDocumentUrl(
        'https://drive.google.com/file/d/abc123/view',
      ),
    ).toBe(true);

    expect(
      isGoogleWorkspaceDocumentUrl(
        'https://docs.google.com/document/d/abc123/edit',
      ),
    ).toBe(true);

    expect(
      isGoogleWorkspaceDocumentUrl(
        'https://docs.google.com/spreadsheets/d/abc123/edit',
      ),
    ).toBe(true);

    expect(
      isGoogleWorkspaceDocumentUrl(
        'https://docs.google.com/presentation/d/abc123/edit',
      ),
    ).toBe(true);
  });

  it('does not classify Drive folders as documents', () => {
    expect(
      isGoogleWorkspaceDocumentUrl(
        'https://drive.google.com/drive/folders/abc123',
      ),
    ).toBe(false);
  });

  it('identifies Drive gateways and equivalent root URLs', () => {
    expect(
      isGoogleDriveGatewayUrl(
        'https://drive.google.com/drive/folders/abc123',
      ),
    ).toBe(true);

    expect(
      isSameNormalizedUrl(
        'https://drive.google.com/drive/folders/abc123/',
        'https://drive.google.com/drive/folders/abc123',
      ),
    ).toBe(true);
  });
});
