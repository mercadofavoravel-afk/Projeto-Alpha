# Publicação do Projeto Alpha em diretório

O WordPress da HostGator continua sendo responsável pelo site existente. O Projeto Alpha é executado na Vercel e publicado em `https://www.imoveisdealtopadraorio.com.br/alpha` por um proxy de caminho no Cloudflare.

## Variáveis de ambiente na Vercel

Configure estas variáveis no ambiente de produção e faça um novo deploy:

```env
NEXT_PUBLIC_SITE_URL=https://www.imoveisdealtopadraorio.com.br
NEXT_PUBLIC_ALPHA_BASE_PATH=/alpha
APP_URL=https://www.imoveisdealtopadraorio.com.br/alpha
```

`NEXT_PUBLIC_SITE_URL` deve ficar somente com a origem. O aplicativo acrescenta `/alpha` para links internos, canonicals, sitemap e robots.

## Proxy no Cloudflare

O Worker versionado está em `cloudflare/alpha-proxy/worker.js`. O arquivo `cloudflare/alpha-proxy/wrangler.toml.example` contém a rota esperada e deve ser copiado para `wrangler.toml` somente no ambiente de deploy.

Configure `ALPHA_ORIGIN` com o domínio de produção atual da Vercel do Projeto Alpha, sem barra final. A rota deve ser exatamente:

```text
www.imoveisdealtopadraorio.com.br/alpha*
```

Não remova `/alpha` do caminho: o Next.js usa esse prefixo para resolver páginas, arquivos estáticos e APIs. Todo tráfego fora dessa rota continua na HostGator, sem alterações no WordPress.

Antes de publicar o Worker, confirme:

- a rota está limitada a `/alpha*`;
- `ALPHA_ORIGIN` aponta para o domínio de produção da Vercel;
- o Worker preserva o caminho `/alpha`;
- nenhuma rota genérica como `www.imoveisdealtopadraorio.com.br/*` foi adicionada.

## Validação após o deploy

Execute:

```bash
npm run smoke:production
```

O smoke test verifica o WordPress e o Alpha:

- `/`;
- `/zona-sul/`;
- `/alpha`;
- `/alpha/empreendimentos`;
- `/alpha/robots.txt`;
- `/alpha/sitemap.xml`.

Depois valide manualmente o envio de lead e as páginas administrativas autenticadas. O comando aceita outra origem por `PRODUCTION_ORIGIN` quando necessário.
