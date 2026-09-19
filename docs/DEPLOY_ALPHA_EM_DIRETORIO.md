# Publicação do Projeto Alpha em diretório

O WordPress da HostGator continua sendo responsável pelo site existente. O Projeto Alpha é executado na Vercel e publicado em `https://imoveisdealtopadraorio.com.br/alpha` por um proxy de caminho no Cloudflare.

## Host canônico

O site atual redireciona `www.imoveisdealtopadraorio.com.br` para `imoveisdealtopadraorio.com.br`. Por isso, o host sem `www` precisa estar coberto pela rota do Worker. Uma rota configurada somente em `www` não é suficiente: após o redirect, `/alpha` volta para a origem do WordPress e responde 404.

## Variáveis de ambiente na Vercel

Configure estas variáveis no ambiente de produção e faça um novo deploy:

```env
NEXT_PUBLIC_SITE_URL=https://imoveisdealtopadraorio.com.br
NEXT_PUBLIC_ALPHA_BASE_PATH=/alpha
APP_URL=https://imoveisdealtopadraorio.com.br/alpha
```

`NEXT_PUBLIC_SITE_URL` deve ficar somente com a origem canônica. O aplicativo acrescenta `/alpha` para links internos, canonicals, sitemap e robots.

## Proxy no Cloudflare

O Worker versionado está em `cloudflare/alpha-proxy/worker.js`. O arquivo `cloudflare/alpha-proxy/wrangler.toml.example` contém as rotas esperadas e deve ser copiado para `wrangler.toml` somente no ambiente de deploy.

Configure `ALPHA_ORIGIN` com o domínio de produção atual da Vercel do Projeto Alpha, sem barra final. A rota obrigatória é:

```text
imoveisdealtopadraorio.com.br/alpha*
```

Também mantenha a rota equivalente em `www` como proteção adicional:

```text
www.imoveisdealtopadraorio.com.br/alpha*
```

Não remova `/alpha` do caminho: o Next.js usa esse prefixo para resolver páginas, arquivos estáticos e APIs. Todo tráfego fora dessas rotas continua na HostGator, sem alterações no WordPress.

Antes de publicar o Worker, confirme:

- o host canônico sem `www` está coberto por `/alpha*`;
- a rota em `www` também está presente;
- `ALPHA_ORIGIN` aponta para o domínio de produção da Vercel;
- o Worker preserva o caminho `/alpha`;
- nenhuma rota genérica como `imoveisdealtopadraorio.com.br/*` foi adicionada.

## Validação após o deploy

Execute:

```bash
npm run smoke:production
```

O smoke test segue redirects e exige HTTP 200 final para:

- `/`;
- `/zona-sul/`;
- `/alpha`;
- `/alpha/empreendimentos`;
- `/alpha/robots.txt`;
- `/alpha/sitemap.xml`.

Depois valide manualmente o envio de lead e as páginas administrativas autenticadas. O comando aceita outra origem por `PRODUCTION_ORIGIN` quando necessário.
