# Projeto ALPHA V13 — CMS, CRM e pipeline operacional

## Entregas desta versão

- Correção das relações Prisma necessárias para livros, atividades, recomendações e analytics.
- Editor visual inicial para empreendimentos.
- Validação editorial com Zod e verificação de intervalos numéricos.
- Arquivamento seguro em vez de exclusão física de empreendimentos.
- API de atividades do CRM para notas, ligações, WhatsApp, e-mail, visitas e tarefas.
- Biblioteca administrativa de mídia.
- API de cadastro de ativos por URL.
- Endpoint para enfileirar books para processamento.
- Auditoria das alterações mais sensíveis.

## Rotas principais

- `/admin/empreendimentos/[id]` — editor do empreendimento.
- `/admin/midia` — biblioteca de mídia.
- `PATCH /api/admin/projects/[id]` — atualização validada.
- `POST /api/admin/leads/[id]/activities` — registro de atividade.
- `POST /api/admin/books/[id]/process` — entrada na fila.

## Limites atuais

- O upload binário ainda não foi conectado a S3 ou Cloudflare R2.
- O processamento de PDF foi preparado como fila, mas requer worker externo.
- O editor ainda não inclui drag-and-drop, recorte de imagem nem ordenação visual.
- Integrações com WhatsApp, e-mail e Calendar continuam pendentes.
- É necessário validar as migrações contra um PostgreSQL real antes da publicação.
