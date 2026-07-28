# Sprint 1.1 — Fundação executável

## Objetivo

Padronizar o ambiente local e a validação automática do Projeto ALPHA sem reescrever o produto existente.

## Entregas

- PostgreSQL 16 e Redis 7 via Docker Compose.
- Dockerfile multi-stage para build e execução do Next.js.
- Saída `standalone` para imagem de produção menor.
- Script de bootstrap para instalação, infraestrutura, Prisma e seed.
- Endpoint `/api/health` com verificação real do banco.
- CI no GitHub Actions com PostgreSQL e Redis.
- TypeScript, ESLint e Prettier padronizados.
- `.env.example`, `.gitignore`, `.dockerignore` e Makefile.

## Inicialização rápida

```bash
cd PROJETO_ALPHA_V10/nextjs-v9
cp .env.example .env
npm run dev:bootstrap
npm run dev
```

Acesse `http://localhost:3000` e verifique `http://localhost:3000/api/health`.

## Alternativa com Make

```bash
make bootstrap
make dev
```

## Execução integral em contêiner

```bash
docker compose --profile full up --build
```

## Critérios de aceite

- `docker compose up -d postgres redis` inicia os serviços com healthchecks.
- `npm run db:generate` gera o Prisma Client.
- `npm run typecheck` não encontra erros após a instalação das dependências.
- `npm run build` produz um build Next.js após a instalação das dependências.
- `/api/health` responde `200` quando o banco está disponível.
- O workflow de CI executa a mesma validação em pull requests.

## Decisão arquitetural

A Sprint 1.1 mantém uma aplicação única. Um monorepo seria prematuro antes de existirem múltiplas aplicações com ciclos independentes. Essa decisão reduz complexidade operacional e preserva uma migração futura para `apps/portal`, `apps/admin` e pacotes compartilhados quando houver necessidade comprovada.

## Antes de produção

- Trocar todas as credenciais e segredos.
- Utilizar PostgreSQL e Redis gerenciados.
- Configurar HTTPS, backups e observabilidade.
- Validar migrações em homologação.
- Não usar as credenciais de desenvolvimento do Compose em produção.

## Validação nesta entrega

A estrutura, os arquivos JSON e o pacote ZIP foram validados. A instalação das dependências não foi concluída no ambiente de geração por limite de tempo; por isso, o build integrado deve ser executado no ambiente local ou na CI.
