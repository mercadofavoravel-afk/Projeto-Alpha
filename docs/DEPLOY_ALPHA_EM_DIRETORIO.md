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

Crie um Worker com uma variável `ALPHA_ORIGIN` apontando para o domínio de produção atual da Vercel do Projeto Alpha (sem barra final). A rota do Worker deve ser:

```text
www.imoveisdealtopadraorio.com.br/alpha*
```

Use este código:

```ts
export default {
  async fetch(request, env) {
    const source = new URL(request.url);
    const origin = new URL(env.ALPHA_ORIGIN);
    const upstream = new URL(`${source.pathname}${source.search}`, origin);
    return fetch(new Request(upstream, request));
  },
};
```

Não remova `/alpha` do caminho: o Next.js usa esse prefixo para resolver páginas, arquivos estáticos e APIs. Todo tráfego fora dessa rota continua na HostGator, sem alterações no WordPress.

## Validação após o deploy

- `/alpha`
- `/alpha/empreendimentos`
- `/alpha/robots.txt`
- `/alpha/sitemap.xml`
- envio de lead e páginas administrativas
- URLs existentes do WordPress, como `/`, `/zona-sul/` e `/barra-da-tijuca/`
