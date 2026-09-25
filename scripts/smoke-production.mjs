const origin = process.env.PRODUCTION_ORIGIN ?? 'https://imoveisdealtopadraorio.com.br';
const canonicalOrigin = 'https://imoveisdealtopadraorio.com.br';

const checks = [
  ...(new URL(origin).hostname === new URL(canonicalOrigin).hostname
    ? [
        { path: '/', status: 200 },
        { path: '/zona-sul/', status: 200 },
      ]
    : []),
  {
    path: '/alpha',
    status: 200,
    includes: `<link rel="canonical" href="${canonicalOrigin}/alpha/"`,
  },
  {
    path: '/alpha/empreendimentos',
    status: 200,
    includes: `<link rel="canonical" href="${canonicalOrigin}/alpha/empreendimentos"`,
  },
  { path: '/alpha/robots.txt', status: 200, includes: `${canonicalOrigin}/alpha/sitemap.xml` },
  { path: '/alpha/sitemap.xml', status: 200, includes: `${canonicalOrigin}/alpha/` },
  { path: '/alpha/api/health', status: 200, health: true },
  { path: '/alpha/admin', status: 307, redirectTo: '/alpha/login' },
  { path: '/alpha/admin/usuarios', status: 307, redirectTo: '/alpha/login' },
  { path: '/alpha/admin/leads', status: 307, redirectTo: '/alpha/login' },
  { path: '/alpha/admin/agenda', status: 307, redirectTo: '/alpha/login' },
  { path: '/alpha/admin/artigos', status: 307, redirectTo: '/alpha/login' },
  { path: '/alpha/api/admin/leads/export', status: 401 },
];

let failed = false;

for (const { path, status, includes, health, redirectTo } of checks) {
  const url = new URL(path, origin);

  try {
    const response = await fetch(url, {
      redirect: redirectTo ? 'manual' : 'follow',
      signal: AbortSignal.timeout(20_000),
    });

    const body = await response.text();
    let healthy = true;
    if (health) {
      try {
        const result = JSON.parse(body);
        healthy = result.status === 'ok' && result.database === 'ok';
      } catch {
        healthy = false;
      }
    }
    const location = response.headers.get('location');
    const ok =
      response.status === status &&
      (!includes || body.includes(includes)) &&
      (!redirectTo || location?.startsWith(redirectTo)) &&
      healthy;
    console.log(
      `${ok ? 'PASS' : 'FAIL'} ${url} -> HTTP ${response.status}; conteúdo esperado: ${includes ? body.includes(includes) : 'n/a'}; banco: ${health ? healthy : 'n/a'}; redirecionamento: ${redirectTo ? location : 'n/a'}; final: ${response.url}`,
    );

    if (!ok) {
      failed = true;
    }
  } catch (error) {
    failed = true;
    console.error(`FAIL ${url} -> ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failed) {
  process.exitCode = 1;
}
