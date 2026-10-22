# Roleta de plantão

Acessar `/alpha/admin/roleta`. Administração e direção criam filas gerais ou por bairros e configuram de um a 24 plantões por dia. Horários e quantidade são editáveis por fila. Os padrões iniciais são 09h–14h e 14h45–09h do dia seguinte, em America/Sao_Paulo. Criar uma fila é uma decisão explícita: a migração não ativa filas nem altera corretores existentes.

Corretores habilitados fazem check-in em cada plantão, a partir de 30 minutos antes. O sorteio consolida uma ordem única e o recebimento percorre essa ordem em rodízio. Entradas tardias ficam no fim; sair e voltar preserva a posição. Limite de capacidade, bairros atendidos, conta ativa, habilitação de recebimento e presença recente são obrigatórios.

O CRM visível renova presença a cada 30 segundos. Sem renovação por três minutos, o participante é ignorado até voltar. Logout e redefinição de senha encerram as participações. Acesso interno e externo usam a mesma sessão autenticada; não há restrição por IP nesta versão.

A ordem é consolidada na primeira execução a partir do horário inicial: presença, novo lead ou rotina agendada. O agendador diário da hospedagem Hobby é complementar, tem precisão por hora e não garante disparo no minuto exato. Com painel online, a verificação ocorre a cada 30 segundos. Não foi contratado outro plano nem configurado agendador externo.

Filas regionais têm prioridade sobre a geral, inclusive se pausadas. Pausar mantém novos leads aguardando. No intervalo ou sem corretor elegível, os contatos ficam associados à fila e são retomados automaticamente. Cada execução processa até 25 contatos elegíveis, em ordem de chegada. Regiões sem elegíveis não bloqueiam outras regiões. Leads históricos sem fila continuam sob distribuição assistida da gestão.

Configuração de horários ou bairros fica bloqueada enquanto houver plantão aberto ou inscrições futuras. Nome e pausa podem ser alterados. Eventos `roulette.configured`, `roulette.checkin`, `roulette.checkout`, `roulette.drawn`, `roulette.turn` e `lead.roulette_assigned` registram a operação. Consultores veem sua participação; gestores veem a equipe; direção e administração veem o conjunto.

## Publicação

Aplicar a migração aditiva `20261022180000_lead_roulette` antes de publicar o código. Ela cria três tabelas, uma coluna nullable em Lead, índices e chaves estrangeiras; não altera leads, usuários ou conteúdo existentes.

A rota `/alpha/api/cron/roleta` exige `CRON_SECRET`. Os dois horários diários no Vercel são complementares aos pulsos do CRM. Preservar a rotina existente de resumo de riscos.

A validação de concorrência usa exclusivamente PostgreSQL local com nome contendo `test`, habilitada por `ROULETTE_DATABASE_TESTS=1`. Nenhum contato de teste deve ser criado no banco de produção. O teste verifica três entradas simultâneas com dois corretores de capacidade um, sorteio único e retomada de um lead em espera sem tocar em lead histórico.

## Validação operacional restante

A gestão precisa cadastrar os corretores reais, revisar bairros e capacidade, criar a fila desejada e acompanhar o primeiro plantão com a equipe. Validar a chegada de um contato real autorizado de cada origem externa separadamente. A existência do receptor Respondi não prova que o formulário externo esteja conectado; essa integração e a conversão de clique no Google Ads são verificações independentes.
