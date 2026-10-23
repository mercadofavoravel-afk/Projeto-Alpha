# CRM da matriz: fechamento operacional

## Prioridade reafirmada em 23/10/2026

Concluir o CRM antes de iniciar os outros módulos comerciais. Licenças,
campanhas em massa, construtor de páginas e cobrança ficam após o aceite do CRM.
A rotina editorial existente é uma operação separada.

Consulta de produção em 23/10 confirmou zero filas de roleta, zero recebimentos
externos e zero formulários Respondi associados a artigos. Há dois cadastros
abertos sem responsável; não são automaticamente clientes comprovados e não
devem ser redistribuídos sem revisão. Três pendências de aviso têm três registros
de envio aceito, e o resumo diário possui execução em 23/10. Isso não comprova
entrega na caixa de entrada ou ingresso dos formulários das campanhas.

O receptor atual do Respondi está limitado ao catálogo de artigos publicados.
Não considerar as páginas comerciais conectadas a esse receptor sem mapear
os formulários reais e validar seus campos. Cliques/conversões no Ads não
comprovam recebimento de um cadastro no CRM.

A branch de fechamento acrescenta contagens de filas, profissionais habilitados,
cadastros aguardando e cadastros fora da roleta no painel de integrações. A
recuperação de e-mail passa a ordenar pelas pendências mais antigas e exclui
avisos de leads inexistentes. Alterações ainda dependem de implantação.

Escopo prioritário: receber os contatos da imobiliária, distribuí-los, registrar
atendimento e manter os acompanhamentos visíveis para a equipe. Licenças,
cobrança e publicação social fazem parte da plataforma completa e não bloqueiam
o uso do CRM da matriz.

## Recursos implementados e cobertos pela suíte

- Formulário nativo grava lead, origem, artigo/bairro, consentimento e tarefas;
  falha do aviso por e-mail não descarta o cadastro.
- Recebimento por fila geral ou por bairros, respeitando disponibilidade e
  capacidade. Sem candidato elegível, o contato fica na fila da gestão.
- Carteira e permissões por corretor/equipe; atribuição e transferência com
  auditoria; lista, filtros, exportação, Kanban, ficha, histórico e agenda.
- Alertas no painel, avisos de novos leads e resumo diário com idempotência;
  diagnóstico das notificações e dos recebimentos externos.

## Correções desta entrega

O Kanban deixa de recortar globalmente os 200 últimos cadastros: cada estágio
possui paginação própria de 25 cartões, contagem completa e consulta limitada à
carteira autorizada. Uma etapa com muitos ganhos não oculta os leads novos de
outra etapa. A consulta dos cartões traz somente a contagem de atividades.

O formulário de atividade converte a data/hora local do aparelho para um
instante ISO com fuso antes de enviar. O receptor rejeita horários ambíguos sem
fuso e JSON inválido antes de gravar. Contato agendado continua sem confirmar
primeiro atendimento. Páginas já abertas antes da implantação precisam ser
recarregadas para carregar o formulário atualizado.

## Validação necessária para declarar a operação concluída

1. Entrar com uma conta da gestão e com a conta de um corretor, conferir as
   carteiras e a abrangência geral/regional. Não compartilhar contas.
2. Acompanhar um cadastro legítimo e autorizado pelo canal efetivamente usado:
   entrada no CRM, origem, responsável ou fila de gestão, registro de contato,
   horário do próximo acompanhamento e visibilidade na agenda.
3. Confirmar a configuração e um recebimento de cada canal externo utilizado.
   Um endpoint implementado, uma variável presente, um clique ou um envio de
   formulário em outro serviço não comprovam ingresso no CRM.
4. Conferir os avisos e a execução diária depois da implantação; aceitação do
   e-mail pelo provedor não comprova leitura pelo destinatário.

O fluxo CRM + e-mail da matriz já foi confirmado pelo proprietário em 18/10.
A validação visual desta rodada continua pendente porque o proprietário estava
dirigindo e pediu prosseguir sem login interativo. Não foram criados cadastros
fictícios, enviados contatos à equipe, alteradas contas ou redistribuídos leads.
O cadastro da Keila permanece como referência, conforme orientação do proprietário.

Manter a entrega em branch própria e PR para revisão; preservar a `main` conforme
orientação anterior. Qualquer publicação deve usar o commit verificado e as
configurações do ambiente de produção, sem reaproveitar credenciais de preview.
