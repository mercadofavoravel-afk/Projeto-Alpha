# Projeto ALPHA V12 — Recomendação e inteligência

## Entregas
- Motor de recomendação determinístico e auditável.
- Questionário público em `/descubra`.
- Ranking por bairro, tipologia, orçamento e preferências.
- Justificativas para cada resultado.
- Persistência dos perfis e resultados no PostgreSQL.
- Eventos de navegação e dashboard inicial.
- Painel interno de recomendações.

## Limitações
O ranking depende da qualidade dos dados do catálogo. Não representa garantia de retorno financeiro. Valores, disponibilidade e condições exigem confirmação comercial.

## Migração
```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run typecheck
```
