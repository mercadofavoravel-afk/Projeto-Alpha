# CRM Alpha: atendimento e captação externa

Diagnóstico de código em 05/10/2026. Referências: [Leadfy Imob](https://www.leadfy.com.br/funcionalidades), [C2S](https://www.contact2sale.com/gestor-de-leads-c2s/), [webhook Google Ads](https://developers.google.com/google-ads/webhook/docs/implementation) e [exemplo oficial Meta Lead Ads](https://github.com/fbsamples/lead-ads-webhook-sample). As funcionalidades das referências são inspiração, não integrações do Alpha.

## Entregue nesta alteração

- Alertas no painel inicial e em `/alpha/admin/leads`: fila sem responsável após 15 minutos, primeiro atendimento pendente após 15 minutos, tarefa vencida e nenhum acompanhamento concluído há 48 horas. Prazos corridos, recalculados ao abrir a página; sem aviso push nem redistribuição automática. Cada consulta respeita os limites de acesso do corretor e do gerente. Categorias podem se sobrepor.
- Receptor do formulário nativo **Google Ads** em `/alpha/api/integrations/google-ads/leads`. Verifica a chave configurada, identifica os campos por `column_id`, guarda campanha e formulário, rejeita contatos incompletos, ignora payloads `is_test`, evita duplicatas por `lead_id`, cria tarefa de primeiro atendimento e tenta atribuir a profissional ativo conforme disponibilidade, capacidade e região. Se não houver profissional apto, o lead fica na fila da gestão. Erros transitórios devolvem 503 para nova tentativa do Google.
- O campo `consent` fica `false` no lead externo porque o payload do Google não informa um aceite separado da política; não é disparada mensagem automática. A configuração do formulário deve apontar para a política de privacidade aplicável.

## Ativação do Google Ads

1. Aplicar a migração `20261005_google_ads_lead_receipts` no banco vinculado ao deploy.
2. Definir `GOOGLE_ADS_LEAD_WEBHOOK_KEY` no ambiente de produção e fazer redeploy. Gerar uma chave longa, exclusiva, e guardá-la fora do repositório.
3. No formulário de lead do Google Ads, configurar a URL pública acima e **a mesma chave**; incluir nome e telefone. A interface e os passos atuais estão na [ajuda oficial](https://support.google.com/google-ads/answer/16729613?hl=pt-BR-GB).
4. Validar um envio autorizado e a ficha no CRM, atribuição e origem. O teste do construtor (`is_test`) recebe HTTP 200 e não cria lead comercial. Não confundir clique no anúncio com envio do formulário: campanhas que levam ao site usam o formulário do próprio Alpha e UTMs.

Esta alteração prepara o receptor, mas **não configura a conta Google Ads, nem aplica migração ou chave na Vercel por si só**.

## Instagram e Facebook Lead Ads

A integração direta de formulários instantâneos da Meta precisa de aplicativo e Página autorizados, assinatura de `leadgen`, escopos/permissões aprovados, verificação da assinatura do webhook, obtenção dos dados pelo Graph API com token no servidor e deduplicação pelo identificador do lead. O webhook costuma entregar um identificador, não todos os campos do cliente. O [exemplo oficial da Meta](https://github.com/fbsamples/lead-ads-webhook-sample) demonstra o recebimento e a busca subsequente. **Não há conexão Meta ativa nesta alteração.** Cliques de Instagram para o site são uma rota distinta e podem ser rastreados por UTMs no formulário do Alpha.

## Próximas entregas para um gestor comercial completo

1. **SLA administrável:** horários de plantão, prazos por fonte, aceite do lead pelo corretor, avisos no celular/e-mail e reatribuição com trilha de auditoria. O alerta visual entregue aqui é a primeira camada.
2. **Funil e execução:** etapas por equipe, próximas tarefas obrigatórias, agenda/visita, motivo de perda, tempo até primeiro contato e relatórios por profissional. Hoje existem status e atividades, mas não uma operação configurável de funil.
3. **Captação:** completar Meta Lead Ads com conexão por conta, aplicar a integração Google Ads em produção, importar fontes e portais com consentimento, origem e deduplicação.
4. **Escala comercial:** grupos, regras por produto/região/campanha, capacidade e plantão; separar dados por organização antes de licenciar o Alpha a outras imobiliárias.

Não ativar repasse automático de leads antigos antes de cadastrar equipe, definir turnos e revisar casos sem responsável.
