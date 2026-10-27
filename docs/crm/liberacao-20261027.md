# Liberação operacional do CRM — 27/10/2026

## Verificado

- Versão funcional de origem: `8c9485283c6faa1db893c6ab5ebf6b09e3193adb`.
- 255 testes existentes passaram; TypeScript, lint (sem erros) e build passaram.
- Quatro testes adicionais executaram importação e repique reais via Prisma e rotas sobre PostgreSQL embarcado PGlite, local e descartável. Verificaram idempotência, normalização, pausa, intervalo, alternância, preservação de atualização posterior e autorização. Esse ambiente não comprova concorrência entre processos PostgreSQL independentes.
- Quatro testes do Worker de agendamento passaram. O Worker chama apenas os endpoints fixos de repique e roleta, recusa ausência de segredo, não segue redirecionamentos e não expõe gatilho HTTP público.
- Migration aditiva `20261026150000_lead_import_repique` aplicada por transação no Neon de produção e registrada em `AuditLog`. Contagem de leads (6) e usuários (4) foi preservada. Nenhum lead de teste foi inserido na produção.
- Deploy de produção solicitado na Vercel: `dpl_HnrT3GPyjkYRysSK1bxZvDTKLfcZ`, sem alteração de `main`.

## Agendamento

O Worker `cloudflare/crm-scheduler` usa cron `* * * * *` e o binding secreto `CRON_SECRET`. Não colocar o segredo em arquivos, URLs ou logs. O valor deve corresponder ao ambiente de produção da aplicação. O Worker não modifica DNS nem o proxy do site.

A autorização da Cloudflare permanece necessária nesta sessão. Não declarar o repique com painel fechado operacional até instalar o Worker, conferir o cron, observar duas execuções automáticas e confirmar a auditoria `lead.repique_server_tick` recente.

## Validação autenticada

Depois de o deploy ficar READY, conferir login, cadastro de equipe, `/alpha/admin/leads/entrada`, permissões e visualização de filas com uma sessão legítima. Acompanhar um contato real autorizado pela gestão antes de declarar o CRM integralmente homologado. Não trocar senha de usuário existente nem fabricar sessões para simular esse aceite.

## Operação

- Equipe: `/alpha/admin/usuarios`.
- Leads, acompanhamento e distribuição assistida: `/alpha/admin/leads`.
- Cadastro manual, CSV/XLSX e repique: `/alpha/admin/leads/entrada`.
- Importar uma lista não envia mensagens ao cliente. A distribuição muda o responsável no CRM e registra histórico.
- Não declarar TimTim, WhatsApp bidirecional, Meta ou Google operacional apenas pela presença de um receptor.
