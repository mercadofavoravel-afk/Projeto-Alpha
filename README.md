# Projeto ALPHA

Plataforma imobiliária construída com Next.js, React, PostgreSQL e Prisma.

## Recursos implementados

- catálogo centralizado de empreendimentos;
- busca, coleções e páginas dinâmicas;
- autenticação com sessões persistidas e redefinição de senha;
- controle de acesso por função e permissão;
- painel administrativo;
- CRM de leads e atividades;
- ingestão e gestão de books e mídia;
- APIs administrativas protegidas;
- sitemap, robots e recursos de SEO;
- motor de recomendações;
- trilha de auditoria.

## Requisitos

- Node.js 22;
- PostgreSQL 16;
- Redis 7;
- variáveis de ambiente baseadas em `.env.example`.

## Executar localmente

```bash
cp .env.example .env
npm ci
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

## Qualidade

```bash
npm run quality
```

## Recuperação de senha em produção

Configure `APP_URL`, `EMAIL_FROM` e `RESEND_API_KEY`. Em desenvolvimento, o fluxo redireciona diretamente para a tela de redefinição com o token temporário.

## Proxy e identificação de IP

Defina `TRUST_PROXY_HEADERS=true` apenas quando a aplicação estiver atrás de um proxy confiável que sobrescreva `x-forwarded-for` e `x-real-ip`.
