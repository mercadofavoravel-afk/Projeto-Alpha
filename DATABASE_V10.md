# Projeto ALPHA V10 — Camada de dados

## Entregas
- PostgreSQL modelado com Prisma.
- Empreendimentos, bairros, incorporadoras, tipologias, amenidades, coleções, mídia, fontes, artigos, usuários e leads.
- Seed e importador do catálogo existente.
- Persistência de leads.
- CRUD REST inicial para empreendimentos.
- Páginas administrativas de leads e empreendimentos.

## Preparação local
```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

## Segurança pendente
Não publicar `/admin` e `/api/admin` sem autenticação, autorização, CSRF, rate limiting e auditoria.
