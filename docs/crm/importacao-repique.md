# Cadastro e repique de leads

Entrada: `/alpha/admin/leads/entrada`, apenas ADMIN e DIRECTOR. O cadastro de equipe permanece em `/alpha/admin/usuarios`.

## Operação

1. Informe o nome da lista/origem. Consentimento só deve ser marcado quando houver registro; importar não cria consentimento retroativo para um contato já existente.
2. Cadastre um contato ou envie CSV/XLSX (primeira aba, até 3 MB, 2.000 contatos, 50 colunas). Confira o mapeamento de nome e telefone e as colunas opcionais.
3. Confira a prévia e as linhas rejeitadas. A confirmação importa apenas linhas válidas. Telefones brasileiros com DDD recebem prefixo 55; telefone/e-mail são usados na deduplicação. Contatos existentes não são sobrescritos. Quando telefone e e-mail apontam para contatos diferentes, a linha é ignorada como ambígua.
4. Opcionalmente selecione profissionais e intervalo para preparar uma fila. A fila começa PAUSED. Importar novamente com o mesmo identificador de requisição retorna o resultado anterior, sem recriar registros.
5. Inicie a fila. O primeiro envio ocorre após o intervalo. ONE distribui um lead por intervalo; ROUND distribui até um por profissional elegível em cada intervalo. Não há recuperação de atrasos em rajada.
6. O repique altera o responsável dentro do CRM e registra atividade e auditoria; não envia WhatsApp, SMS ou e-mail ao cliente. Não declara integração Respondi/Timtim operacional.

## Elegibilidade e histórico

Somente os profissionais selecionados, ativos e habilitados a receber, respeitando região e capacidade. Não depende de presença na roleta de plantão. O responsável atual não recebe o mesmo lead novamente. Uma fila sem elegível mantém os itens pendentes; a gestão deve conferir capacidade e regiões. Leads ganhos/perdidos não entram. Mudanças de status/dados/responsável depois da preparação fazem o item ser ignorado, preservando o trabalho posterior. Pausar não desfaz atribuições já concluídas.

A transação usa o mesmo advisory lock da roleta e das atribuições manuais, mais atualização condicional do lead. O histórico individual mantém o responsável anterior, o novo e a campanha. A tela mostra contagens totais e os últimos 20 itens; demais registros permanecem no banco/auditoria.

## Liberação operacional pendente

- Aplicar migration `20261026150000_lead_import_repique` antes de servir a versão nova. Migration aditiva: duas tabelas; não altera contatos existentes.
- Publicar a versão revisada sem alterar main sem autorização.
- Para funcionar com painel fechado, configurar um agendador de servidor que faça GET em `/alpha/api/cron/repique` pelo menos uma vez por minuto, com `Authorization: Bearer <CRON_SECRET>` obtido de armazenamento seguro. Não incluir o segredo no código, URL ou logs.
- O cron atual do Vercel no repositório é diário e NÃO atende intervalos de 3/30 minutos. Não se deve anunciar o agendamento como pronto por existir apenas a rota.
- A tela consulta a última execução comprovada por auditoria `lead.repique_server_tick`. Exigir uma execução recente e acompanhar uma campanha real autorizada antes da liberação. O intervalo é mínimo: a execução efetiva depende da frequência/atraso do agendador.
- Com painel visível existe pulso autenticado a cada 30 segundos; isso é um complemento, não substitui o agendador.
- Testar fluxo completo em banco isolado e autenticação na versão publicada, sem criar leads de teste na produção. Não foram enviados avisos externos ou alterados usuários reais durante a implementação.
