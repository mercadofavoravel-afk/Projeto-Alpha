# Inventário competitivo prioritário — 12/10/2026

Escopo indicado pelo proprietário: Invexo, Apartamentos Rio, Lançamentos RJ,
Lançamentos Rio, Lopes Rio e Patrimóvel. A marca “Utopia” do Rio requer domínio
confirmado: a pesquisa por nome isolado trouxe uma empresa portuguesa, que não
deve entrar no benchmarking carioca por engano. Comprimob é secundária neste ciclo.

## Evidência de catálogo público

Consultas públicas em 12/10/2026. Contagens exibidas pelo próprio site podem
mudar, ser agregadas ou incluir estoque desatualizado; não equivalem a vendas,
tráfego ou número de artigos. URLs de produto, hubs de bairro, artigos e imóveis
prontos são classes separadas.

| Operador | Evidência pública | O que ainda precisa ser contado |
| --- | --- | --- |
| [Apartamentos Rio](https://www.apartamentosrio.com.br/lancamentos) | A captura consultada exibiu **270 lançamentos à venda**; o sitemap lista **272 URLs `/lancamento/`** e **275 URLs `/blog/`**. Há filtros, páginas individuais e CTA para material. | Duplicações de produto, imóveis prontos e atualização do catálogo. |
| [Lançamentos Rio](https://www.lancamentosrio.com.br/lancamentos) | Busca exibiu **82** em captura anterior; o sitemap lista **88 URLs `/lancamento/`** e **207 URLs `/blog/`**. | Páginas que ainda resolvem, produtos únicos e intenção dos artigos. |
| [Lançamentos RJ](https://lancamentosrj.com/blog) | O [sitemap de blog](https://lancamentosrj.com/sitemap/blog.xml) lista **6.181 URLs `/blog/<slug>`**, mais **1.517 tags** e **65 categorias**. O próprio site declara **609 lançamentos ativos** e **73 bairros**, sem auditoria independente. | Verificar páginas que resolvem e consolidar artigos por intenção; catálogo histórico não equivale ao estoque atual. |
| [Invexo Luxury](https://luxury.invexo.com.br/) | O sitemap lista **19 posts `/noticias/`** e **1.316 entradas** em dois sitemaps de imóveis; [página do Leblon](https://luxury.invexo.com.br/imoveis-leblon-rj/) apresenta índice próprio de m². | Outras propriedades Invexo, páginas únicas atuais e método dos índices. |
| [Lopes Rio](https://lopesrio.com.br/) | Páginas de incorporadoras com produtos e blog ligado ao catálogo. | Qual domínio/unidade comparar, total de páginas únicas e conteúdo de alto padrão relevante. |
| [Patrimóvel](https://patrimovel.com.br/lancamentos/) | Os sitemaps listam **192 URLs de lançamento** e **4.225 de imóveis prontos**; o índice não anunciou sitemap editorial separado. | Confirmar páginas válidas, imóveis únicos e artigos fora dos sitemaps. |

### Método e limites da contagem

Consulta aos XML públicos em 12/10/2026, contando apenas `url/loc` no namespace
de sitemap, nunca `image:loc`. O [script reproduzível](../scripts/competitor_sitemap_inventory.py)
percorre índices no mesmo domínio e exporta CSV com URL, sitemap, primeiro
segmento do caminho e `lastmod`. Para Lançamentos RJ, ele encontrou **13.106
entradas únicas** em nove sitemaps filhos, mas há páginas de filtros, tags,
condomínios, imóveis prontos e artigos; o número não representa 13.106 textos.
O domínio Lopes Rio retornou 404 para `robots.txt`, `sitemap.xml` e
`sitemap_index.xml` nesta amostra. Utopia continua sem domínio carioca confirmado.
Sitemap não comprova indexação, tráfego, originalidade, atualidade ou conversão.

Uma amostra inicial de URLs do blog de Lançamentos RJ inclui perguntas sobre
studios junto ao metrô no Flamengo, locação de temporada, microterritório da
Rua Paul Redfern e pronto versus pré-lançamento em Ipanema. Esses são **temas
para investigar**, não textos para copiar nem evidência de demanda comprovada.

No Neon do Alpha, nesta data: **15 empreendimentos PUBLISHED, 59 artigos
PUBLISHED e 2 artigos DRAFT**. O WordPress oficial tem páginas adicionais;
15 não é o total de produtos que a marca já divulgou. Deduplicar ambos antes
de publicar novo catálogo. A diferença entre 15 projetos cadastrados no Alpha
e aproximadamente 270 itens exibidos pela Apartamentos Rio não se resolve criando centenas de textos:
precisamos de produtos próprios autorizados e dados atuais para cada ficha.

## Primeira rodada de cobertura original

1. **Ipanema, lançamento:** comparar tipologias e uso de Be.in.Rio Nascimento
   Silva e outros produtos próprios confirmados. Parque Studios apareceu no
   catálogo concorrente; só entra como produto da marca após confirmar página
   própria e autorização comercial. Revisar artigos já existentes antes de
   abrir uma nova intenção.
2. **Leblon, pronto versus lançamento:** identificar imóveis prontos realmente
   representados pela marca; sem esse catálogo, a comparação deve explicar
   documentação, prazo e custo sem inventar unidade disponível.
3. **Jardim Botânico/Gávea:** completar o catálogo próprio de produtos
   confirmados ou construir guias de decisão de bairro com fontes oficiais;
   não converter anúncio de concorrente em produto da marca.
4. **Barra, Green Park/Kronos:** construir páginas de escolha por planta,
   rotina e custo total, integradas às páginas e formulários próprios; atualizar
   preço e disponibilidade somente com tabela datada e autorizada.

Para cada URL concorrente inventariada: domínio, URL canônica, tipo de página,
bairro, produto, intenção, data da consulta, CTA, evidência de planta/preço,
contraparte própria, oportunidade e decisão editorial. Contar uma intenção uma
vez, ainda que existam títulos quase sinônimos. Priorizar por demanda própria
observada no Search Console e por lead atribuído no CRM; sem dados privados do
concorrente, classificar sua página como visível na amostra, nunca como a mais
convertida. O objetivo é cobertura maior **quando houver inventário real**, com
informação mais útil, segura e específica, não equivalência mecânica de URLs.

## Próxima verificação

Usar o CSV integral exportado pelo script para agrupar as 6.181 URLs de artigo
por intenção e conferir amostras de páginas, sobretudo as de Ipanema e Leblon.
Cruzá-las com WordPress, Alpha, produtos próprios e Search Console antes de
abrir pautas. Os sitemaps de Lopes Rio e Utopia e outras propriedades da Invexo
seguem sem inventário; não afirmar quem é o maior concorrente **em artigos
indexados**. Nenhuma dessas contagens justifica replicar milhares de textos ou
publicar sem produto, fonte e CTA próprios.
