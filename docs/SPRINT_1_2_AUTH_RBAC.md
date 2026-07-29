# Sprint 1.2 — Autenticação e RBAC

## Implementado

- sessões persistentes no PostgreSQL;
- cookie HTTP-only, SameSite=Lax e Secure em produção;
- invalidação de sessão expirada ou usuário bloqueado;
- limitação de tentativas de login por janela temporal;
- recuperação de senha com token de uso único e validade de 30 minutos;
- invalidação de todas as sessões após troca de senha;
- papéis: ADMIN, EDITOR, CONSULTANT, MARKETING e VIEWER;
- permissões centralizadas;
- proteção de páginas administrativas e APIs;
- página de usuários restrita ao administrador;
- teste unitário inicial de RBAC.

## Dependência externa pendente

O fluxo de recuperação gera o token, mas em produção exige um provedor de e-mail transacional. Em desenvolvimento, o sistema redireciona diretamente para a redefinição para facilitar o teste.

## Critérios de aceite

1. Usuário não autenticado é redirecionado para `/login`.
2. Sessão inválida também é recusada pela camada de servidor.
3. CONSULTANT não edita catálogo.
4. VIEWER não altera dados.
5. Somente ADMIN abre `/admin/usuarios`.
6. O reset de senha expira em 30 minutos e só funciona uma vez.
7. Todas as sessões anteriores são encerradas após redefinição.

## Execução

```bash
npm install
npm run dev:infra
npm run db:generate
npm run db:migrate
npm run db:seed
npm run quality
```

A migração Prisma deve ser gerada em um ambiente com PostgreSQL ativo.
