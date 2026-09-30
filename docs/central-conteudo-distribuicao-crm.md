# Central de conteúdo e distribuição assistida do CRM

Implementado em 28/09/2026 para consolidar a operação editorial, social e
comercial no painel do Projeto Alpha.

## Central de conteúdo

O endereço `/alpha/admin/conteudo` mantém o calendário diário visível e reúne:

- formato, data e hora do Rio, empreendimento, região e público;
- tema, legenda, mídia, CTA e destino oficial;
- vínculo opcional com um artigo da biblioteca editorial;
- Instagram, Facebook, LinkedIn, YouTube, TikTok, Kwai e blog;
- estado individual e URL pública de cada canal.

Uma publicação somente é confirmada quando sua URL pública é registrada. O
painel não transforma um artigo automaticamente em vídeo e não afirma que uma
rede foi integrada sem autorização e retorno da API correspondente.

## Distribuição assistida do CRM

Em `/alpha/admin/usuarios`, a gestão configura por profissional:

- disponibilidade para receber leads;
- capacidade máxima de leads ativos;
- regiões de atendimento.

Em `/alpha/admin/leads`, a ação **Distribuir fila** processa até 25 leads sem
responsável. A escolha respeita região, capacidade e menor carga proporcional,
mantém a atribuição manual existente e grava atividade e auditoria. A função é
assistida e acionada por uma pessoa autorizada; não ativa repasse permanente
sem que as regras comerciais estejam configuradas.

## Integrações externas

As estruturas estão preparadas para adaptadores oficiais por canal. Conexões
reais exigem contas autorizadas, escopos aprovados, tokens no servidor e
confirmação por plataforma. Nenhuma senha de rede social deve ser armazenada
diretamente pelo Alpha.
