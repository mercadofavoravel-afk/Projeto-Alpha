import 'server-only';

import { db } from '@/lib/db';
import { decryptMarketingToken, encryptMarketingToken } from '@/lib/marketing-oauth';

export type SelectableAccount = { id: string; name: string; token?: string };
type Connection = {
  id: string;
  provider: string;
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string | null;
  expiresAt: Date | null;
};

export async function activeMarketingAccessToken(connection: Connection) {
  if (!connection.expiresAt || connection.expiresAt.getTime() > Date.now() + 60_000)
    return decryptMarketingToken(connection.accessTokenEncrypted);
  if (connection.provider !== 'google_ads' || !connection.refreshTokenEncrypted) return null;
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: decryptMarketingToken(connection.refreshTokenEncrypted),
      client_id: clientId,
      client_secret: clientSecret,
    }),
    signal: AbortSignal.timeout(10_000),
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const result = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!result.access_token || typeof result.expires_in !== 'number') return null;
  await db.marketingConnection.update({
    where: { id: connection.id },
    data: {
      accessTokenEncrypted: encryptMarketingToken(result.access_token),
      expiresAt: new Date(Date.now() + result.expires_in * 1000),
    },
  });
  return result.access_token;
}

export async function selectableMarketingAccounts(
  connection: Connection,
): Promise<SelectableAccount[] | null> {
  const token = await activeMarketingAccessToken(connection);
  if (!token) return null;
  if (connection.provider === 'google_ads') {
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    if (!developerToken) return null;
    const response = await fetch(
      'https://googleads.googleapis.com/v25/customers:listAccessibleCustomers',
      {
        headers: { Authorization: `Bearer ${token}`, 'developer-token': developerToken },
        signal: AbortSignal.timeout(10_000),
        cache: 'no-store',
      },
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { resourceNames?: string[] };
    return (data.resourceNames || [])
      .filter((resource) => /^customers\/\d{1,20}$/.test(resource))
      .map((resource) => {
        const id = resource.slice('customers/'.length);
        return { id, name: `Conta Google Ads ${id}` };
      });
  }
  if (connection.provider === 'meta') {
    const version = process.env.META_GRAPH_VERSION || 'v24.0';
    if (!/^v\d+\.\d+$/.test(version)) return null;
    const accounts: SelectableAccount[] = [];
    let after: string | undefined;
    for (let page = 0; page < 10; page += 1) {
      const url = new URL(`https://graph.facebook.com/${version}/me/accounts`);
      url.searchParams.set('fields', 'id,name,access_token');
      url.searchParams.set('limit', '100');
      if (after) url.searchParams.set('after', after);
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10_000),
        cache: 'no-store',
      });
      if (!response.ok) return null;
      const result = (await response.json()) as {
        data?: { id?: string; name?: string; access_token?: string }[];
        paging?: { cursors?: { after?: string }; next?: string };
      };
      for (const account of result.data || []) {
        if (account.id && /^\d{1,40}$/.test(account.id) && account.access_token)
          accounts.push({
            id: account.id,
            name: account.name || `Página ${account.id}`,
            token: account.access_token,
          });
      }
      if (
        !result.paging?.next ||
        !result.paging.cursors?.after ||
        result.paging.cursors.after === after
      )
        break;
      after = result.paging.cursors.after;
    }
    return accounts;
  }
  return null;
}

export async function unsubscribeMetaPage(pageId: string, encryptedToken: string | null) {
  if (!/^\d{1,40}$/.test(pageId) || !encryptedToken) return false;
  const version = process.env.META_GRAPH_VERSION || 'v24.0';
  if (!/^v\d+\.\d+$/.test(version)) return false;
  try {
    const response = await fetch(
      `https://graph.facebook.com/${version}/${pageId}/subscribed_apps`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${decryptMarketingToken(encryptedToken)}` },
        signal: AbortSignal.timeout(8_000),
        cache: 'no-store',
      },
    );
    return response.ok;
  } catch {
    return false;
  }
}
