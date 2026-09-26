# Distribuição orgânica multicanal — Projeto Alpha

Diagnóstico inicial em 26/09/2026. Inventário técnico não equivale a cadastro em
plataformas externas ou garantia de indexação. Atualizar a auditoria em
`/alpha/admin/canais` quando cada conta e URL forem verificadas.

## Estado comprovado

- O domínio oficial e a listagem de conteúdo do WordPress são públicos e aparecem
  em resultados de busca por pesquisa direta.
- `/alpha/sitemap.xml` responde publicamente, com URLs canônicas de páginas
  publicadas. O sitemap foi enviado à propriedade do domínio no Google Search
  Console em 26/09/2026. O desempenho anterior do domínio inteiro não mede só o
  Alpha; conferir URLs com filtro `/alpha/` para reportar presença própria.
- O Alpha tem metadados canônicos, Open Graph e Twitter Cards, JSON-LD básico,
  páginas de artigos individuais e atribuição de leads por parâmetros UTM.
- Cadastro da empresa no Maps, contas de redes sociais, ZAP e Bing Webmaster
  Tools não foram confirmados. Ausência de confirmação não significa inexistência.

## Execução por grupo

| Grupo                                       | Distribuição                                                                          | Prova exigida                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Google Busca e Imagens                      | Páginas únicas por bairro, produto e intenção; fotos próprias com descrições precisas | Relatórios por página e por tipo de pesquisa no Search Console                 |
| Google Maps / Perfil da Empresa             | Ficha elegível, reivindicada e verificada, com site e área de atendimento reais       | URL e acesso de gestão à ficha oficial                                         |
| Bing e Copilot                              | Verificar site no Bing Webmaster Tools; importar o sitemap Alpha                      | Cobertura e consultas por URL no Bing; citação no Copilot somente se observada |
| Apple Maps e guias locais                   | Verificar ficha e consistência do nome, contato e localização ou área de serviço      | Ficha pública da marca com URL própria                                         |
| YouTube, Instagram, TikTok, Kwai e LinkedIn | Publicar criativos nativos por bairro/produto e dirigir ao artigo ou página própria   | Perfil oficial, URL da publicação, dados da plataforma e visitas rastreadas    |
| ZAP, Viva Real e OLX                        | Anúncios de imóveis autorizados, com oferta atualizada e retorno ao CRM               | Conta anunciante, URLs ativas, custo e leads atribuídos                        |

Google Maps e Perfil da Empresa são uma ficha local, não um artigo indexado.
Copilot depende de fontes de busca na web e não é uma conta de publicação do
Alpha. Portais imobiliários podem exigir contratação comercial; não assumir
distribuição automática a partir do sitemap.

## Pauta e mensuração

Ipanema e Leblon recebem prioridade editorial. Rodiziar também Gávea, Jardim
Botânico, Botafogo, Flamengo, São Conrado, Barra da Tijuca, Recreio, Tijuca,
Jacarepaguá, Centro e Porto Maravilha conforme produtos confirmados, dores de
compra e intenção de busca. Antes de produzir, deduplicar contra o WordPress e
o Alpha por intenção. Cada artigo publicado deve ter slug, URL canônica e CTA
próprios; não multiplicar dez textos com a mesma promessa ou conteúdo.

Padrão de links externos: `?utm_source=instagram&utm_medium=social&utm_campaign=nome-da-pauta`
(substituir os valores reais por canal e campanha). Direcionar ao conteúdo
correspondente no domínio oficial. Conferir o URL público antes da postagem e
evitar parâmetros UTM em links internos, pois eles podem sobrescrever a origem
de entrada. Sem UTM, o Alpha identifica plataformas conhecidas pelo domínio do
referenciador quando o navegador o fornece; não infere consultas, Google
Imagens ou visitas de apps sem referência. O painel `/alpha/admin/origens`
contabiliza leads com origem identificada, não
visitas nem impressões. Medição de visitas do Alpha e integração dos relatórios
GA4, Search Console, Bing e redes sociais permanecem etapas separadas.

## Sequência operacional

1. Confirmar propriedade e URLs de perfis da marca; só então vincular perfis
   reais ao site e ao JSON-LD `sameAs`.
2. Conferir indexação no Google Search Console e ativar Bing Webmaster Tools;
   verificar a elegibilidade e propriedade da ficha local no Google e Apple.
3. Revisar imagens, títulos, canônicos, formulário e cada destino editorial.
4. Adaptar conteúdo por formato, registrar URLs de postagens e usar links
   rastreáveis nas bio, descrições e campanhas.
5. Comparar semanalmente consultas/impressões em buscadores, alcance nas
   plataformas, visitas no site e leads no CRM sem misturar métricas.
