# Diagnóstico funcional: celular, CRM e publicação social

Verificado no código do Projeto Alpha em 26/09/2026. O funcionamento dos
serviços externos e das contas comerciais requer confirmação nos próprios
painéis de cada plataforma.

## O que já existe

| Função                                       | Estado e endereço                                                                                                                                                                                                                |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cadastro de diretores, gerentes e corretores | `/alpha/admin/usuarios`; administrador cria as funções, diretor cadastra gerentes e corretores; senha individual e controle de acesso ativo.                                                                                     |
| Entrada de leads de artigos e produtos       | Formulários nas páginas `/alpha/artigos/[slug]` e `/alpha/empreendimentos/[slug]` criam registros em `/api/leads`; exigem consentimento, criam tarefas de acompanhamento e preservam a página, a região e a origem identificada. |
| Fila e distribuição comercial                | `/alpha/admin/leads`; leads novos começam sem responsável. Administração, diretor ou gerente escolhem um profissional ativo na ficha do lead; corretor vê somente os próprios leads.                                             |
| Acompanhamento                               | Ficha do lead registra atividades e mudança de status; o quadro comercial está em `/alpha/admin/leads/kanban`.                                                                                                                   |
| Conteúdo e acervo                            | `/alpha/admin/artigos` cria e revisa artigos; `/alpha/admin/midia` apresenta materiais cadastrados por URL e ainda não faz upload direto de arquivos.                                                                            |
| Uso pelo telefone                            | O painel tem menus e tabelas adaptados para telas menores. O manifesto de aplicativo do painel permite adicionar um atalho à tela inicial em navegadores compatíveis; continua exigindo login e conexão à internet.              |

## O que falta construir ou integrar

### Publicação em Instagram, Facebook, TikTok, Kwai e LinkedIn

Cada corretor entra com sua **própria conta Alpha**. Em `Minhas contas`, conecta
individualmente suas redes por autorização oficial da plataforma, sem informar
ao Alpha a senha do TikTok, Instagram ou outra rede. Uma conexão pertence ao
corretor e à organização; a empresa também pode manter contas institucionais
separadas. Revogar a autorização interrompe novas publicações nessa conta.

Em `Minhas publicações`, o corretor pode receber arquivo ou URL de mídia,
escrever legenda específica de cada rede, escolher página de destino própria,
horário e conta de destino. O fluxo necessário é **rascunho → revisão conforme
permissão → seleção de contas e formatos → agendamento ou envio → confirmação
por canal → registro do link público e falhas**.
Um envio aprovado para uma rede não deve aparecer como publicado nas outras
até cada API confirmar o resultado. Vídeo, foto e texto têm exigências
diferentes conforme o canal; um artigo Alpha não vira automaticamente um vídeo.

Hoje não existe essa tela, agendador nem conexão autenticada com as quatro
redes. Instagram e Facebook exigem integração com a Meta e as permissões
da conta adequada. TikTok oferece API de publicação mediante autorização da
conta, escopo aprovado e revisão do aplicativo; sem a aprovação, a publicação
pública por API não deve ser prometida. A disponibilidade de uma API de
publicação para Kwai e a conta autorizada precisam ser confirmadas antes de
marcar o canal como automático. LinkedIn precisa de permissão para o perfil ou
página efetivamente conectados. Tokens ficam protegidos no servidor, com
acesso restrito e possibilidade de revogação; cada postagem registra auditoria.

**Isolamento em escala:** a base atual ainda não tem organização e proprietário
para cada vídeo, conta social e postagem. Para operar com 100–500 corretores
ou mais, criar `Organization`, `Membership`, `SocialConnection`, `SocialAsset`,
`SocialPost` e `PublicationAttempt`. Todo registro próprio leva `organizationId`
e `ownerUserId`; uma concessão de acesso explícita e auditada pode compartilhar
um item específico com gestor ou colega. Todas as consultas, endpoints, uploads,
links temporários, filas e resultados da API precisam verificar organização,
proprietário e permissão **no servidor**. O corretor não recebe tokens nem URLs
privadas de outra pessoa, inclusive alterando parâmetros ou IDs no navegador.
Paginação, índices por organização e proprietário, processamento em fila e
limites por rede evitam carregar a biblioteca de 500 corretores de uma vez.

| Papel                   | Publicações e contas pessoais                                                 | Leads e acompanhamento                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Corretor                | Cria, vê e publica somente itens seus ou compartilhados expressamente com ele | Vê somente os leads atribuídos a ele; registra contatos e tarefas                                        |
| Gerente                 | Vê e revisa somente a equipe e os itens expressamente autorizados             | Distribui e acompanha os leads da equipe conforme escopo definido                                        |
| Diretor / administrador | Audita e gerencia a organização conforme permissões registradas               | Configura equipe e regras de distribuição; não usa a conta social pessoal de um corretor sem autorização |

O CRM atual restringe o corretor aos leads atribuídos, mas ainda não separa
empresas diferentes nem implementa o escopo de uma equipe por gerente. Isso
precisa ser fechado antes de oferecer o Alpha como produto para várias empresas.

## Licenciamento para empresas: painel central e painéis clientes

Este é o destino comercial do projeto, **ainda não implementado**. O papel
`ADMIN` atual administra a instalação única: não existe superadministrador
separado, empresa cliente, assinatura ou suspensão por falta de pagamento.

| Nível                            | Quem controla                                                                                  | Limite                                                          |
| -------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Proprietário da plataforma       | Cria e suspende licenças, configura planos, acompanha cobranças e audita organizações          | Não depende da assinatura de uma empresa cliente                |
| Administrador da empresa cliente | Gerencia corretores, gestores, conteúdos e redes da própria empresa, dentro do plano adquirido | Não enxerga outras empresas nem pode criar proprietário central |
| Gerente e corretor               | Atuam apenas na equipe, nos leads e nas publicações autorizados                                | Não alteram licenças nem permissões centrais                    |

Implementação proposta após estabilizar o CRM, a publicação e o acesso móvel:

1. Criar identidade de organização e associação de usuários; migrar todos os
   registros atuais para uma **organização proprietária** sem perder dados.
   Separar o papel `PLATFORM_OWNER` de `TENANT_ADMIN`, com autorização conferida
   em todas as consultas e mutações no servidor. A senha identifica uma pessoa;
   a licença e o bloqueio pertencem à organização cliente.
2. Criar plano, contrato, cobrança, vencimento e estado de acesso por empresa:
   `ACTIVE`, `PAYMENT_PENDING`, `GRACE_PERIOD`, `SUSPENDED` e `CANCELED`.
   A regra solicitada é suspensão da empresa após 30 dias sem pagamento, com
   marco inicial (vencimento do boleto) e tratamento de compensação bancária
   definidos no contrato. Avisos e período de tolerância devem ser configuráveis.
3. Integrar um provedor de cobrança adequado a boletos; receber a confirmação
   de pagamento por notificação autenticada e consultar o estado da cobrança
   antes de mudar a licença. Repetição de eventos não pode duplicar cobrança ou
   liberar uma organização errada. Um boleto apenas gerado não equivale a pago.
4. Aplicar a suspensão **somente** à organização devedora em login, APIs,
   tarefas agendadas e publicação social. Manter acesso limitado à cobrança e
   ao suporte para regularização; preservar dados, trilhas e possibilidade de
   reativação. O painel e a organização proprietária nunca dependem da licença
   de uma empresa cliente.
5. Testar duas empresas independentes e usuários com papéis distintos: nenhum
   corretor ou administrador cliente pode acessar mídia, contas sociais,
   pagamentos ou leads da outra empresa mesmo alterando URL ou ID. Testar
   suspensão, baixa de pagamento e reativação de uma empresa sem alterar a outra.

A decisão do provedor e dos planos comerciais requer avaliação posterior das
condições contratadas; o Alpha não deve ativar cobrança ou suspender clientes
com base em simulação de pagamento.

### E-mails e distribuição comercial

O e-mail em `/alpha/admin/usuarios` é a **conta de acesso** do corretor.
Cadastrar uma lista de e-mails de clientes para campanhas é outra função:
o Alpha ainda não tem importação dessa lista, segmentação, disparo em lote ou
relatórios de entrega. O serviço de e-mail existente em `lib/email.ts` é para
**redefinição de senha**; não significa que campanhas estejam prontas.

Para dividir uma lista de contatos entre profissionais, a função precisa de
importação com validação e deduplicação, registro da origem e autorização de
contato, distribuição com trilha de responsável e tarefas, além de tratamento
de contatos que não devem receber novos envios. Enviar os dados pessoais
brutos por e-mail a todos os corretores não é necessário para a distribuição:
cada profissional pode recebê-los em sua área do CRM após a atribuição.
Listas de um corretor seguem as mesmas regras de propriedade e acesso dos
leads; uma lista institucional requer permissão e escopo separados.

### Aplicativo e avisos

O atalho instalável abre o painel com layout de aplicativo. Não inclui modo
offline, notificações push, aplicativo distribuído em loja ou acesso ao CRM
sem internet. Os próximos passos são testar em Android e iPhone, melhorar as
telas que apresentem dificuldades no celular e implementar avisos de novo
lead atribuído se necessários, respeitando as preferências da equipe.

## Verificações práticas

1. Acessar o painel com uma conta de diretor ou administrador e cadastrar um
   corretor em `/alpha/admin/usuarios`.
2. Abrir um artigo publicado, preencher o formulário com um contato real
   autorizado e conferir a chegada em `/alpha/admin/leads` e a origem.
3. Atribuir o lead ao corretor na ficha, conferir o acesso do corretor ao
   próprio lead e registrar um acompanhamento.
4. Confirmar propriedade das contas sociais da empresa e permissões da API
   antes de ativar a publicação por canal. Não realizar postagens nem disparos
   de e-mail em lote como testes sem uma campanha aprovada.
