# Projeto Alpha — plataforma de divulgação e vendas

## Compromisso do produto

O Alpha reúne aquisição de clientes, publicação, páginas de conversão, campanhas e atendimento imobiliário. O CRM é parte da plataforma. Licenças vendidas devem receber os módulos contratados com administração própria; publicação de artigos, SEO, campanhas, construtor de landing pages e autonomia do corretor fazem parte do escopo comercial, não são extras descartados. Outros segmentos devem poder adaptar nomes, campos e conteúdo sem misturar seus dados.

## Estrutura e permissões

- Matriz: administra empresas licenciadas, planos, módulos e limites. A matriz não compartilha automaticamente suas listas ou números de WhatsApp com licenciados.
- Empresa licenciada: diretor administra sua licença, equipe, permissões, filas, domínios, campanhas e integrações.
- Gerente: opera a equipe autorizada dentro da mesma empresa.
- Corretor: acessa seus contatos, leads, listas, páginas e número conectado conforme a autonomia concedida pela direção. Sua conta é um assento da empresa; não cria outra empresa implicitamente.
- Todo contato, importação, campanha, conexão, página, artigo e evento precisa pertencer à empresa e ter dono ou escopo de compartilhamento explícito. Checagens de isolamento devem ocorrer no servidor, em consultas, arquivos, exportações, filas e webhooks.

## Módulos e critérios de aceite

| Módulo                | Entrega operacional exigida                                                                                            | Estado confirmado no código em 22/10/2026                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| CRM                   | Ficha, origem, Kanban, agenda, distribuição e permissões                                                               | Implementado na matriz; roleta publicada, sem fila geral ativada                                                                  |
| Cadastro pela gestão  | E-mail com URL, login e senha inicial individual; troca de senha em Minha conta; recuperação de falha                  | Ajuste em implementação nesta branch                                                                                              |
| Roleta                | Quantidade e horários editáveis; três ou mais sorteios; disponibilidade e auditoria                                    | Ajuste de um a 24 plantões em implementação nesta branch                                                                          |
| SEO e artigos         | Conteúdo comercial, metadados, sitemap, origem e CTA rastreável                                                        | Implementado na matriz; isolamento e publicação por empresa ainda precisam ser implementados                                      |
| Contatos/importação   | CSV, XLSX, tabelas DOCX e PPTX; prévia, mapeamento, validação, duplicatas e relatório                                  | Importação comercial de contatos ainda não implementada; importação de candidatos de catálogo existente não atende este requisito |
| WhatsApp              | Número do corretor, autorização, conexão real por QR quando suportada pelo provedor, estado e desconexão               | Há links de atendimento individual; conexão e envio de campanhas ainda não implementados                                          |
| Campanhas WhatsApp    | Listas, segmentos, conteúdo, prévia, agendamento, pausa e relatório por destinatário                                   | Ainda não implementado                                                                                                            |
| Campanhas e-mail      | Listas, editor, segmentos, agendamento, descadastro, falhas e relatório                                                | E-mail transacional existe; campanhas em massa ainda não implementadas                                                            |
| Construtor de páginas | Formulário com apresentação, imagens, vídeo, plantas, localização e CTA; prévia, publicação e edição com domínio e SEO | Há páginas e catálogo da matriz; construtor autônomo para licenciados ainda não implementado                                      |
| Licenças e cobrança   | Empresas isoladas, assentos, permissões, limites, assinatura e bloqueio por inadimplência                              | Ainda não implementado; cobrança permanece no final conforme instrução do usuário                                                 |

## Cadastro e acesso

A direção cadastra o profissional e define função, gerente, bairros e capacidade. O sistema envia URL e credenciais iniciais ao endereço informado. Senha é armazenada somente como hash; não entra em logs de auditoria. Confirmação do provedor de e-mail não é confirmação de leitura ou entrega na caixa de entrada. Falha de envio preserva a conta e permite enviar link individual de definição de senha sem divulgar ou armazenar a senha antiga. O corretor pode trocar a senha autenticado em Minha conta.

## Importações

Planilhas estruturadas: CSV e XLSX. DOCX e PPTX exigem extração das tabelas, com prévia e confirmação de colunas antes de gravar. Não inventar telefone ou e-mail ausente; não tratar texto solto como lista validada. A importação registra empresa, corretor responsável, arquivo de origem, linhas aceitas, inválidas e duplicadas. A direção controla se o corretor pode importar e enviar campanhas. A condição de inscrição e descadastro acompanha cada contato.

## Integrações de campanhas

E-mail: avaliar Resend Broadcasts como primeiro adaptador, aproveitando o serviço transacional já presente. Sua existência no provedor não significa que campanhas estejam integradas no Alpha. Segmentar por empresa e corretor; processar descadastro e eventos de entrega. Brevo é alternativa com API de contatos e campanhas. Não contratar plano ou aumentar gastos sem necessidade e autorização.

WhatsApp: escolher um provedor com integração suportada e onboarding real. O QR code deve vir de uma sessão/autorização válida; não exibir QR demonstrativo. O número pertence ao corretor ou à empresa conforme política explícita. Webhooks, destinatários e credenciais permanecem vinculados à empresa. Implementar fila de saída, prevenção de duplicidade, pausa, registro de erros e eventos de entrega. Envio em massa não é uma sequência de links wa.me.

## Ordem de execução

1. Concluir e validar cadastro/e-mail, senha própria e horários flexíveis já em implementação.
2. Introduzir empresas, assentos e isolamento com migração da matriz e testes de acesso entre empresas antes de disponibilizar licenças a terceiros.
3. Entregar contatos e importação com prévia e permissões.
4. Conectar provedor WhatsApp e campanhas, depois e-mail de campanhas com adaptador e isolamento.
5. Construtor de páginas por licença, preservando o padrão comercial Alpha e materiais reais.
6. Validação de ponta a ponta com uma empresa e corretor autorizados, depois cobrança e planos.

Não considerar a plataforma comercial finalizada apenas por existir menu, tela ou cadastro de integração. Cada módulo precisa executar sua ação real e mostrar o resultado, incluindo falhas e dependências externas.

## Referências verificadas

- Leadfy, primeiros passos: https://www.leadfy.com.br/ajuda/primeiros-passos
- Leadfy, check-in e check-out: https://leadfy-imob.com.br/ajuda/check-in-e-check-out
- Resend Broadcasts: https://www.resend.com/features/broadcasts
- Resend contatos/descadastro: https://www.resend.com/features/audiences
- Brevo API: https://developers.brevo.com/
