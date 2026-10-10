import 'server-only';

import { lookup } from 'node:dns/promises';
import { request } from 'node:https';
import { BlockList, isIP } from 'node:net';

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

export async function verifyWordPressEditor(
  siteUrl: string,
  username: string,
  appPassword: string,
) {
  const normalized = normalizeWordPressSite(siteUrl);
  if (!normalized) return null;
  const url = new URL(`${normalized}/wp-json/wp/v2/users/me?context=edit`);
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
  return new Promise<{ id: number; name: string } | null>((resolve) => {
    const req = request(
      url,
      {
        method: 'GET',
        headers: { Authorization: `Basic ${credential}`, Accept: 'application/json' },
        lookup: (_host, _options, callback) => callback(null, address, 4),
        timeout: 8000,
        maxHeaderSize: 16_384,
      },
      (response) => {
        if (response.statusCode !== 200) {
          response.resume();
          resolve(null);
          return;
        }
        let text = '';
        response.setEncoding('utf8');
        response.on('data', (chunk: string) => {
          text += chunk;
          if (text.length > 65_536) {
            req.destroy();
            resolve(null);
          }
        });
        response.on('end', () => {
          try {
            const user = JSON.parse(text) as {
              id?: unknown;
              name?: unknown;
              capabilities?: { edit_posts?: unknown };
            };
            resolve(
              Number.isSafeInteger(user.id) && user.capabilities?.edit_posts === true
                ? { id: user.id as number, name: String(user.name || username).slice(0, 120) }
                : null,
            );
          } catch {
            resolve(null);
          }
        });
        response.on('error', () => resolve(null));
      },
    );
    req.on('timeout', () => req.destroy());
    req.on('error', () => resolve(null));
    req.end();
  });
}
