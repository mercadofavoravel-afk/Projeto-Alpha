# Acervo comercial

O painel interno `/admin/acervo` reúne links, pastas, books, plantas, tabelas e fichas técnicas, agrupados por incorporadora ou origem confirmada. O acesso exige `media:write`, inclusive nas ações de cadastro e organização. O menu, Books e Fontes apontam para o acervo.

`ArchiveItem` mantém a origem e separa o cadastro de um link da disponibilidade de um arquivo. `LINK_REGISTERED` significa somente que o endereço foi guardado; não certifica acesso ao destino. `FILE_PENDING` identifica um documento localizado cujo original ainda não foi copiado para o Alpha. O painel pode mostrar um trecho do texto recuperado, sem oferecer um download inexistente.

URLs são deduplicadas removendo parâmetros de acompanhamento e normalizando variantes de pastas Drive, preservando IDs de documentos e outros parâmetros relevantes. Arquivos importados são deduplicados pelo SHA-256 dos bytes. Uma nova importação não sobrescreve a curadoria existente. Referências de procedência permanecem no banco privado, sem URLs temporárias ou arquivos privados no repositório.

Materiais sem autoria comprovada ficam em “Incorporadora a confirmar”. A equipe pode corrigir incorporadora e empreendimento no próprio painel. Tabelas históricas devem ser confirmadas na origem antes de qualquer uso comercial.

A cópia dos PDFs para armazenamento privado permanece pendente: a conexão de hospedagem recusou a criação do armazenamento com HTTP 403. Não há cópia binária no banco nem publicação pública desses documentos. A tabela do acervo tem uma migração aditiva, sem alterar leads ou o catálogo publicado.
