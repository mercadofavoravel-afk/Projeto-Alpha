# Resultados por artigo

Página privada `/alpha/admin/artigos/desempenho`, com link em Publicações e no
menu da gestão. Apenas ADMIN e DIRECTOR da instalação matriz acessam a página
e sua API; corretores, gerentes, edição e marketing não recebem os agregados.
Não existe contador público. Isolamento entre empresas e contratação do módulo
de artigos ainda precisam ser implementados antes da venda a terceiros.

O painel mostra os últimos 28 dias: visualizações, visualizações de hoje em
Brasília, tráfego marcado orgânico/pago, acionamentos de atendimento e cadastros
recebidos com articleSlug. A tabela pode ser buscada por título/bairro e ordenada
por visitas, leads, cliques ou impressões Google. Cada artigo detalha plataforma,
grupo de tráfego e resultado. Não há dados pessoais na resposta da API.

Dados Alpha atualizam a cada 30 segundos enquanto o painel está visível. Visita
é evento de carregamento, não pessoa única ou clique de busca. Retornos, acessos
internos e bloqueadores podem afetar a medição. O rastreador de cliques registra
links ao atendimento do próprio artigo, Respondi, Tintim e WhatsApp; não prova
conversa ou cadastro. Leads podem incluir testes; a tela não os chama de vendas.
Marcadores Google gclid/gbraid/wbraid classificam novos acessos como pagos sem
armazenar os identificadores. Dados antigos não são reclassificados por palpite.

## Google Search Console

Cache importado por rotina autorizada, separado do coletor do site. A última
linha de AuditLog com action `editorial.search_snapshot` tem metadata:
`{property, dataState, startDate, endDate, fetchedAt, rows}`. Propriedade fixa
`sc-domain:imoveisdealtopadraorio.com.br`, dataState `final`, datas YYYY-MM-DD,
fetchedAt ISO UTC, rows com keys `[URL, data]`, clicks, impressions, position.
Consultar os últimos 28 dias, dimensions page/date, filtro do domínio principal
com/sem www e caminho `/alpha/artigos/`, e paginar até esgotar. Só gravar após
sucesso e coleta completa; inserir snapshot vazio em falha apagaria evidência.
Somente um resultado realmente vazio e bem-sucedido pode ser salvo vazio.
Não salvar token ou credencial em metadata. Confirmar leitura após inserção.

A API valida o cache, filtra o período, soma cliques e impressões por artigo,
recalcula CTR e pondera posição por impressões. Mostra data de importação e
último dia com dados; ausência de linha fica `—`, nunca prova de não indexação.
Datas Search Console não são convertidas em horários de Brasília. As datas e
atualização do Alpha são apresentadas separadamente. O atraso da plataforma
não vira promessa de cliques de busca em tempo real.

Impressões de redes sociais e anúncios por artigo ainda não estão integradas;
isso fica explícito no painel. As origens de visitas e leads disponíveis são
UTMs/referência capturada, incluindo origem desconhecida. Não copiar números do
site inteiro para os artigos nem atribuir impressão de campanha sem URL correta.
