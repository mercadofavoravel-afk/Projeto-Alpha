# Acervo comercial

O painel interno `/admin/acervo` reúne links de incorporadoras, imobiliárias e pastas comerciais, agrupados pela origem confirmada, com busca por empreendimento. O usuário abre a origem para consultar e baixar os materiais no computador. O acesso exige `media:write`, inclusive nas ações de cadastro e organização.

O fluxo usa links. Não copia books ou outros arquivos para a plataforma. A consulta do painel exige URL cadastrada e não carrega textos dos documentos. Referências documentais previamente catalogadas sem URL permanecem no banco privado para procedência, fora da listagem de acesso.

URLs são deduplicadas removendo parâmetros de acompanhamento e normalizando variantes de pastas Drive, preservando IDs de documentos e outros parâmetros relevantes. Uma nova importação não sobrescreve a curadoria existente. Arquivos privados e URLs temporárias não são incluídos no repositório.

Materiais sem autoria comprovada ficam em “Incorporadora a confirmar”. A equipe pode corrigir incorporadora e empreendimento no próprio painel. Links cadastrados não certificam a disponibilidade do destino; as pastas preservam as permissões de suas origens. O menu, Books e Fontes apontam para o acervo.

A tabela ArchiveItem tem uma migração aditiva, sem alterar leads ou o catálogo publicado.
