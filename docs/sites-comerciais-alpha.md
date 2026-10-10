# Sites de clientes no Alpha

## Modelo de acesso

O usuário entra no Alpha com seu próprio e-mail e senha. A matriz tem contas internas e administra a plataforma. Cada cliente deve pertencer a uma organização isolada, que pode ter membros e vários sites. O `CustomerSite` desta etapa pertence diretamente a um usuário e serve de começo para esse modelo; ainda não representa isolamento completo de organizações.

## WordPress

Em **Meus sites**, o usuário editorial informa a URL HTTPS, o nome do usuário WordPress e **uma senha de aplicativo do WordPress**, criada para o Alpha. Nunca se deve pedir ou armazenar a senha principal do painel. O Alpha verifica `users/me?context=edit` e a capacidade `edit_posts` na API REST antes de gravar a senha de aplicativo criptografada. A conexão é própria de quem a criou, admite até dez sites por conta e pode ser removida. O endereço é validado e a requisição HTTPS é fixada num IP público verificado, sem seguir redirecionamentos. Instalações sem um endereço IPv4 público ou API REST acessível não são aceitas nesta etapa.

Referência: [senhas de aplicativo na documentação oficial do WordPress](https://developer.wordpress.org/advanced-administration/security/application-passwords/).

Esta etapa **não publica posts** nem altera arquivos SEO. Para isso, cada artigo futuro precisará de `siteId`, autor/organização, slug e status próprios. Antes da publicação, o editor precisa revisar originalidade, fatos, links e renderização. A API REST do WordPress recebe título, resumo, conteúdo, slug e estado do post; metadados de plugins SEO exigem integração compatível específica, e arquivo físico, robots e sitemap dependem do CMS e da hospedagem do cliente. O Alpha não pode assumir que um plugin qualquer expõe seus campos para escrita.

## WhatsApp

O botão `wa.me` atual abre uma conversa individual e não é um disparador automatizado. O módulo comercial de envio deve associar uma conta WhatsApp Business Platform à organização, guardar os identificadores e tokens por cliente, registrar consentimento do destinatário e opt-out, usar modelos aprovados quando a empresa inicia a conversa, limitar envios, guardar tentativas/respostas e processar webhooks assinados. Nenhum envio em massa ou teste é ativado por esta migração.

Referência: [Política de Negócios oficial do WhatsApp](https://business.whatsapp.com/policy/preview?lang=pt_BR).

## Antes de oferecer a clientes externos

1. Criar organizações e membros com papéis próprios, migrar a matriz e escopar **todas** as consultas e mutações de leads, equipe, artigos, catálogo, arquivos, fontes, analítica e integrações.
2. Criar um editor de posts por site, publicação explícita na API REST, armazenamento da URL e ID remotos, revisão de resposta/erros, renovação/revogação de credenciais e suporte a plugins SEO conhecidos.
3. Conectar Search Console por propriedade verificada e gerar recomendações e arquivos compatíveis com cada CMS, sem presumir acesso à hospedagem.
4. Integrar oficialmente WhatsApp Business Platform por cliente, com consentimento, templates aprovados, webhook e auditoria.
5. Concluir cobrança com valor configurável, boleto e confirmação autenticada, aplicar teste de 30 dias e tolerância de cinco apenas à organização inadimplente, além de validar reativação.
6. Implantar as migrações, configurar a chave de criptografia, validar um WordPress de cada cliente e ensaiar separação entre dois clientes reais ou de homologação antes de abrir as inscrições.
