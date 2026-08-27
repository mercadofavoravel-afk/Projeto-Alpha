const GOOGLE_DOCUMENT_HOSTS = new Set([
  'drive.google.com',
  'docs.google.com',
]);

function normalizedHost(value: string) {
  try {
    return new URL(value)
      .hostname
      .toLowerCase()
      .replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function isGoogleDriveGatewayUrl(
  value: string,
) {
  return (
    normalizedHost(value) ===
    'drive.google.com'
  );
}

export function isGoogleWorkspaceDocumentUrl(
  value: string,
) {
  try {
    const url = new URL(value);
    const host = normalizedHost(value);

    if (
      !GOOGLE_DOCUMENT_HOSTS.has(host)
    ) {
      return false;
    }

    return /^\/(?:file|document|spreadsheets|presentation|forms)\/d\/[^/]+/i.test(
      url.pathname,
    );
  } catch {
    return false;
  }
}

export function isSameNormalizedUrl(
  first: string,
  second: string,
) {
  try {
    const normalize = (value: string) => {
      const url = new URL(value);

      url.hash = '';

      if (
        url.pathname.length > 1 &&
        url.pathname.endsWith('/')
      ) {
        url.pathname =
          url.pathname.slice(0, -1);
      }

      return url.toString();
    };

    return (
      normalize(first) ===
      normalize(second)
    );
  } catch {
    return false;
  }
}
