# Changelog — Sprint 1.4

## Adicionado

- Regras de pontuação SEO reutilizáveis em `lib/seo/rules.ts`.
- Identificadores estáveis para cada verificação de SEO.
- `maxScore` e `percentage` no resultado da auditoria.
- Helper de URL canônica com normalização de domínio e caminhos.
- Builder de Metadata do Next.js com canonical, robots, Open Graph e Twitter Cards.
- API pública centralizada em `lib/seo/index.ts`.
- Testes unitários para score, canonical e metadata.

## Alterado

- SEO Mission Control passou a consumir a API pública de `lib/seo`.
- Painel exibe pontuação, valor máximo e percentual.
- Versão do pacote atualizada para `1.0.0-alpha.4`.

## Compatibilidade

- `calculateSeoScore(document)` mantém o campo `score` e a lista `checks` usados pela aplicação.
- Nenhuma alteração no banco de dados ou no schema Prisma.
