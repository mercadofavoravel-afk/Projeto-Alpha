const origin = process.env.PRODUCTION_ORIGIN ?? 'https://imoveisdealtopadraorio.com.br';
const canonicalOrigin = 'https://imoveisdealtopadraorio.com.br';

const checks = [
  { path: '/', status: 200 },
  { path: '/zona-sul/', status: 200 },
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
];

let failed = false;

for (const { path, status, includes, health } of checks) {
  const url = new URL(path, origin);

  try {
    const response = await fetch(url, {
      redirect: 'follow',
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
    const ok = response.status === status && (!includes || body.includes(includes)) && healthy;
    console.log(
      `${ok ? 'PASS' : 'FAIL'} ${url} -> HTTP ${response.status}; conteúdo esperado: ${includes ? body.includes(includes) : 'n/a'}; banco: ${health ? healthy : 'n/a'}; final: ${response.url}`,
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
