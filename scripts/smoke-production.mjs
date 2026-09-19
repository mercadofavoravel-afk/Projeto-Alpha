const origin =
  process.env.PRODUCTION_ORIGIN ??
  'https://imoveisdealtopadraorio.com.br';

const checks = [
  ['/', 200],
  ['/zona-sul/', 200],
  ['/alpha', 200],
  ['/alpha/empreendimentos', 200],
  ['/alpha/robots.txt', 200],
  ['/alpha/sitemap.xml', 200],
];

let failed = false;

for (const [path, expectedStatus] of checks) {
  const url = new URL(path, origin);

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(20_000),
    });

    const ok = response.status === expectedStatus;
    console.log(
      `${ok ? 'PASS' : 'FAIL'} ${url} -> HTTP ${response.status}; final: ${response.url}`,
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
