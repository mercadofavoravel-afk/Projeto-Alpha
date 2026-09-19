const origin =
  process.env.PRODUCTION_ORIGIN ??
  'https://www.imoveisdealtopadraorio.com.br';

const checks = [
  ['/', [200]],
  ['/zona-sul/', [200]],
  ['/alpha', [200, 301, 302]],
  ['/alpha/empreendimentos', [200, 301, 302]],
  ['/alpha/robots.txt', [200]],
  ['/alpha/sitemap.xml', [200]],
];

let failed = false;

for (const [path, expectedStatuses] of checks) {
  const url = new URL(path, origin);

  try {
    const response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(20_000),
    });

    const ok = expectedStatuses.includes(response.status);
    console.log(
      `${ok ? 'PASS' : 'FAIL'} ${url} -> HTTP ${response.status} (esperado: ${expectedStatuses.join(', ')})`,
    );

    if (!ok) {
      failed = true;
    }
  } catch (error) {
    failed = true;
    console.error(
      `FAIL ${url} -> ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

if (failed) {
  process.exitCode = 1;
}
