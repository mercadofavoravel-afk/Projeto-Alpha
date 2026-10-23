# Captação por artigo: matriz Imóveis de Alto Padrão Rio

O formulário nativo do Alpha continua no artigo e grava no CRM com `articleSlug`, bairro, URL de visualização e UTMs disponíveis. A integração externa adiciona um **formulário Respondi separado por artigo** e um **link Tintim do site separado por artigo**. O link do Tintim inicia conversa no WhatsApp; não é o formulário Respondi nem prova que o contato virou lead no CRM.

Leads novos do formulário nativo, de um formulário Respondi **efetivamente associado** a artigo publicado e dos receptores já existentes de Meta e Google Ads passam a registrar, na mesma transação de criação no CRM matriz, uma pendência de aviso para `contato@imoveisdealtopadraorio.com.br`. Havendo `RESEND_API_KEY` e `EMAIL_FROM` válidos, a aplicação tenta enviar o aviso após gravar o lead. Falha do e-mail não descarta o cadastro: a rotina já existente `/alpha/api/cron/crm-digest` tenta recuperar até dez avisos pendentes por execução. O envio tem chave de idempotência por lead e auditoria de entrega. Não pressupor que e-mail foi entregue apenas porque um lead existe; consultar a auditoria `lead.email_notification.sent` e o provedor. A caixa da matriz não deve ser usada como destino de futuros clientes licenciados.

## Cadastro no painel Alpha

Em `/alpha/admin/artigos/<id>`, a seção **Captação por artigo** recebe o ID e a URL pública `https://form.respondi.app/<ID>` e o link rastreável HTTPS do Tintim. O ID precisa coincidir com a URL. Os links não podem ser usados em dois artigos. Enquanto não forem cadastrados, o artigo mantém apenas o formulário nativo. Não copie uma URL de outro cliente/licenciado para a matriz.

## Formulário Respondi da matriz

Criar no painel da conta matriz um formulário para cada artigo com perguntas exatamente intituladas `Nome completo`, `Telefone / WhatsApp`, `E-mail`, `O que procura?` e `Autorizo o contato da Imóveis de Alto Padrão Rio` (resposta `Sim` ou `Não`). Nome e telefone devem ser obrigatórios. Exibir finalidade e política de privacidade no próprio formulário. Publicar e conferir a URL pública antes de associá-la ao artigo. Respondi conserva a resposta em sua própria conta; a confirmação da entrega ao CRM requer o webhook.

Definir no ambiente de produção `RESPONDI_WEBHOOK_TOKEN` como segredo aleatório com ao menos 32 caracteres, sem colocá-lo no repositório ou no navegador. Na configuração de webhook de cada formulário Respondi, apontar para `https://imoveisdealtopadraorio.com.br/alpha/api/integrations/respondi/leads?token=<SEGREDO>`; essa URL é privada e deve ficar apenas no painel do provedor. O Respondi documenta POST JSON com `form.form_id`, `respondent.respondent_id`, `status`, `answers` e `respondent_utms`. O receptor aceita apenas respostas completas, ID mapeado para artigo publicado, campos identificáveis e token correto. A chave `(form_id, respondent_id)` impede criação duplicada em reenvio. No CRM registra bairro, artigo, UTMs e auditoria; autorização para contato é verdadeira apenas com `Sim`. Não envie um lead real ou de teste em produção sem autorização específica.

O provedor não documenta assinatura criptográfica do corpo na referência consultada; proteger a URL, controlar acesso ao painel Respondi e rotacionar o token se exposto. As perguntas têm de coincidir exatamente; uma mudança de rótulo exige ajuste do mapeamento antes de ativar.

## Formulários das páginas comerciais — entrega de 23/10

O CRM também permite mapear formulários Respondi independentes dos artigos em
`/alpha/admin/integracoes/respondi`. A gestão informa ID real, nome, página no
domínio oficial, bairro e os títulos exatos das perguntas. Nome e telefone são
obrigatórios; e-mail, interesse e pergunta de autorização podem ficar vazios.
Sem resposta explícita `Sim` na pergunta configurada, a autorização é falsa.
A mesma pergunta não pode alimentar campos distintos. Associações novas ficam
pausadas até ativação explícita pela gestão.

Um formulário vinculado a artigo não pode ser substituído por essa associação.
Artigos não publicados continuam recusados. O receptor conserva a mesma chave
privada, limite de corpo, deduplicação por formulário/respondente e transação
de gravação, atribuição e aviso. Páginas comerciais usam origem `Respondi |
página: ...`, mantêm UTMs e não inventam `articleSlug` nem origem orgânica.
A URL da página consta na auditoria de recebimento.

Pré-requisito: aplicar a migração aditiva `20261023150000_respondi_landing` antes
de publicar o código. Ela cria apenas o catálogo de associações; não insere
formulários, não ativa filas e não altera leads existentes. Conferir os campos
e o webhook na conta Respondi e acompanhar um recebimento autorizado continuam
obrigatórios. Esta entrega de código não comprova a integração em produção.

## Tintim (entrada ainda pendente)

Criar no Tintim um **link para site** nomeado pelo slug de cada artigo e associar o mesmo número da operação matriz. Colar o link íntegro no catálogo Alpha; não reescrever sua query string. Para preservar UTMs e parâmetros de visita, instalar também o pixel específico fornecido pelo painel Tintim nas páginas do domínio. Sem esse pixel, o link pode abrir WhatsApp sem registrar origem. O webhook `lead_create` do Tintim pode ser configurado para CRM, mas requer amostra real do formato, autenticação e regra de reconciliação por telefone para impedir duplicatas entre formulário e conversa. Esse ingresso **ainda não está implementado**: conversa iniciada no Tintim não aparece automaticamente no CRM Alpha.

## Validação para ativação

Aplicar migração, publicar o código, associar URLs verificadas e testar leitura do formulário público, envio por webhook e presença de `articleSlug`, bairro, UTMs e consentimento na ficha do CRM. Conferir também o pixel e a origem de uma conversa no Tintim. A validação de envio real deve ser coordenada separadamente; não confundir cliques no botão, abertura de WhatsApp e lead recebido.

Referências do fornecedor consultadas em 13/10/2026: [payload Respondi](https://help.respondi.app/article/48-webhooks-payload-de-exemplo), [criação de formulário](https://help.respondi.app/article/42-como-criar-um-formulario), [URL pública Respondi](https://help.respondi.app/article/93-como-atualizar-o-endereco-do-meu-formulario-para-o-novo-padrao), [webhooks Tintim](https://tintim.app/base-de-conhecimento/como-funcionam-os-webhooks-do-tintim/) e [pixel e link rastreável](https://tintim.app/base-de-conhecimento/como-instalar-o-link-rastreavel-do-tintim-no-botao-flutuante-de-whatsapp/).
