export const endpoints = ['/alpha/api/cron/repique', '/alpha/api/cron/roleta'];

export async function tick(env, request = fetch) {
  if (!env.CRON_SECRET) throw new Error('CRON_SECRET binding is required');
  const results = await Promise.all(
    endpoints.map(async (path) => {
      try {
        const response = await request(`https://imoveisdealtopadraorio.com.br${path}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
          redirect: 'error',
          signal: AbortSignal.timeout(55000),
        });
        await response.body?.cancel();
        return { path, status: response.status, ok: response.ok };
      } catch {
        return { path, status: 0, ok: false };
      }
    }),
  );
  // Never log credentials, lead payloads or response bodies.
  console.log(JSON.stringify({ event: 'crm.scheduler', results }));
  if (results.some((result) => !result.ok)) throw new Error('CRM scheduler tick failed');
  return results;
}

const worker = {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(tick(env));
  },
  async fetch() {
    return new Response('Not found', { status: 404 });
  },
};

export default worker;
