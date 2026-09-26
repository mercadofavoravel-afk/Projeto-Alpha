# Projeto Alpha: CRM, conteúdo e descoberta orgânica

Diagnóstico de código e pesquisa de produto em 26/09/2026. Esta é uma referência
para priorizar entregas, não uma declaração de que todos os canais estão conectados.
O acesso autenticado ao Neon, às redes dos corretores e aos painéis externos deve
ser comprovado antes de registrar métricas ou declarar integrações operacionais.

## Referências de mercado

| Referência                                               | Função descrita pelo fornecedor                                                           | Adaptação útil no Alpha                                                                                                                                     |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [C2S](https://www.contact2sale.com/gestor-de-leads-c2s/) | Captação multicanal, filas por campanha, plantão, check-in, alertas e histórico           | Priorizar primeiro responsável, tempo até o primeiro contato e alertas ao gestor; configurar regras por produto/equipe antes de distribuir automaticamente. |
| [Leadfy Imob](https://leadfy.com.br/funcionalidades)     | Repasse de leads sem atendimento, rodízio, importação de planilhas, check-in e atividades | Criar disponibilidade por corretor e importação auditável, sem perder origem, consentimento ou histórico da transferência.                                  |
| [Kenlo Imob](https://kenlo.com.br/produtos/imob)         | Lead, imóvel, visita e funil em uma jornada acessível no celular                          | Vincular interesse do lead a artigo/produto, visita e próxima tarefa; medir a jornada inteira por origem e responsável.                                     |

Esses itens descrevem páginas públicas dos fornecedores, consultadas nesta data;
as regras exatas de cada produto podem mudar. Não copiar interfaces, marcas,
mensagens comerciais nem assumir que todas as integrações funcionam no Alpha.

## Situação real do Alpha

| Etapa        | Estado verificado no código                                                                                              | Falta para operação mais completa                                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Entrada      | Formulários de artigo e empreendimento gravam lead com consentimento e origem; sequência sugerida de follow-up é criada. | Conferir no Neon e em produção com contatos reais autorizados; adicionar deduplicação e integração com leads de portais/redes.                               |
| Distribuição | Administrador, diretor e gerente atribuem manualmente a usuário ativo; o corretor vê apenas leads atribuídos.            | Regra configurável de fila, disponibilidade, prazo para aceite e reatribuição; gerente ainda vê a base global da instalação.                                 |
| Atendimento  | Status, ficha, atividades, agenda e quadro comercial existem.                                                            | Primeiro contato com prazo, notificações, alerta de lead parado e vínculo explícito com visita/proposta.                                                     |
| Conteúdo     | Artigos têm rascunho, revisão, publicação, slug e página própria; empreendimento tem página e formulário.                | Auditoria de artigos e páginas reais, deduplicação por intenção, pesquisa editorial e validação dos links antes de publicar lotes.                           |
| Resultados   | Painéis de origem e canais; UTM e referências reconhecidas preservadas no formulário.                                    | Dados confiáveis de Search Console, Bing Webmaster, perfis sociais, portais e analytics por URL; sem esses dados não afirmar indexação ou visitas por canal. |
| Celular      | Interface responsiva e manifesto instalável para o painel autenticado.                                                   | Conferência em aparelhos reais, notificações autorizadas, acesso sem conexão se for requisito.                                                               |

A agenda agora separa o botão **Preparar mensagem** das atividades de WhatsApp;
ligação, visita, tarefa, e-mail e nota abrem o lead. O botão **Concluir
acompanhamento** registra uma ação manual, não confirma envio externo. Indicadores
de atraso e vencimento consultam toda a base visível ao usuário; a tabela mostra
até 100 itens e informa quando há mais.

## Sequência para colocar em operação

1. **Validação da base:** comparar contagens de leads/artigos, permissões e URLs
   no banco e no domínio; conferir origem e consentimento de registros reais.
   Evitar criar leads fictícios na produção.
2. **Rotina comercial:** decidir quem atende cada produto/região, horários,
   prazo de primeiro contato e quem recebe alerta de atraso. Só depois ativar
   distribuição automática; manter atribuição manual e trilha de auditoria.
3. **Rotina editorial:** revisar cada artigo e página publicada no Alpha e no
   WordPress do domínio, intenção de busca, fatos, CTA e link próprio. Criar
   conteúdo original por região e produto, com foco maior em Ipanema e Leblon
   sem abandonar os demais bairros. Cada artigo aprovado terá URL própria.
4. **Distribuição e medição:** usar o [mapa de canais](./distribuicao-organica.md)
   e `/alpha/admin/canais`; confirmar separadamente propriedade do perfil,
   indexação, publicação efetiva, visita e lead atribuído. Um sitemap enviado
   não comprova exibição em buscadores.
5. **Escala de equipe:** adicionar fila configurável, disponibilidade,
   reatribuição com prazo e relatórios por corretor/gestor; restringir gerente
   à sua equipe antes de habilitar múltiplas empresas.
6. **Comercialização:** depois de estabilizar o CRM e a publicação, separar
   organizações, dados e administradores; implementar contratos, cobrança e
   suspensão apenas da empresa cliente, preservando o painel proprietário.

## Superfícies para descoberta e captação

| Grupo                | Canais a acompanhar                                                           | Verificação necessária                                                                               |
| -------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Busca e mapas        | Google Busca/Imagens/Maps/Perfil da Empresa; Bing/Copilot; Apple Maps; Ecosia | Propriedade, cobertura de páginas, presença no mapa e consultas com dados dos respectivos painéis.   |
| Vídeo e redes        | YouTube, Instagram, Facebook, TikTok, Kwai, LinkedIn                          | Perfil oficial, URL de cada publicação, link de destino no próprio domínio e eventos de conversão.   |
| Portais e diretórios | ZAP Imóveis, Viva Real, OLX e portais locais pertinentes                      | Anúncio publicado, regras de integração, link para página própria quando permitido e origem do lead. |

Não considerar automaticamente todas essas superfícies como integradas. Redes
sociais exigem contas e permissões próprias; integração de publicação por corretor
e acesso isolado a suas mídias continuam no [diagnóstico de produto](./operacao-mobile-crm-publicacao.md).
