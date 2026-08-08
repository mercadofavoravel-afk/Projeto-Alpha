# Projeto ALPHA V11 — Segurança e operação

## Implementado

- Sessões persistentes no PostgreSQL.
- Cookies HTTP-only, SameSite=Lax e Secure em produção.
- Senhas com bcrypt.
- Proteção server-side do painel.
- Proteção das novas APIs administrativas.
- Auditoria de ações críticas.
- CRM com atividades.
- Workflow de ingestão de books.
- Biblioteca de mídia estruturada.

## Limites

- Não foi configurado storage externo.
- Não há recuperação de senha, MFA ou convite de usuários.
- Não há rate limiting distribuído.
- O pipeline de extração do PDF é apenas modelado.
- As migrations precisam ser geradas em ambiente com PostgreSQL.

## Próxima etapa

- Storage S3/R2 e URLs pré-assinadas.
- Worker assíncrono para books.
- MFA e recuperação de conta.
- Editor completo de empreendimentos.
- Integração CRM e notificações.
