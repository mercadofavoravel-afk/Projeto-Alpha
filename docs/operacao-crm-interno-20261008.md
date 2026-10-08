# Alpha: operação comercial da imobiliária

Atualizado em 08/10/2026. Este documento cobre o uso da imobiliária proprietária. Licenciamento a outras empresas exige isolamento por organização e cobrança em uma etapa separada.

## Fluxo de atendimento

1. O administrador ou diretor abre `/alpha/admin/usuarios`, cadastra gerente e corretores com acessos individuais, vincula cada corretor a um gerente, define regiões, capacidade e disponibilidade. Nunca compartilhe uma conta entre profissionais.
2. O administrador abre `/alpha/admin/equipe` para ver, por profissional, leads ativos, primeiro contato pendente após 15 minutos, acompanhamentos vencidos e leads parados após 48 horas. O gerente vê apenas a própria equipe. Um aviso no painel consulta essas pendências a cada minuto enquanto a aba está visível; cada consulta respeita as permissões da pessoa conectada. Não há alerta por e-mail ou push quando o painel está fechado.
3. Um novo contato do formulário próprio ou de integração ativada entra no CRM. A distribuição automática de novos leads considera profissional ativo, disponibilidade, capacidade e região. Quando não há candidato, o lead permanece na fila da gestão. A página `/alpha/admin/leads` permite distribuição assistida, transferência manual e filtro por profissional.
4. O corretor registra uma ligação, WhatsApp, e-mail ou visita **realizada**, sem prazo futuro, na ficha do lead. Só esse registro confirma o primeiro contato, conclui a tarefa inicial e promove um lead `NEW` a `CONTACTED`. Trocar apenas o estágio do funil não comprova atendimento.
5. O corretor agenda o próximo contato com prazo na mesma ficha; o item aparece em `/alpha/admin/agenda`. A gestão revisa os atrasos e transfere manualmente se necessário. Concluir um lembrete não envia mensagem automaticamente.
6. O gerente ou diretor filtra a carteira por profissional; a exportação CSV aplica o mesmo filtro e as permissões de acesso.
7. O administrador ou diretor consulta `/alpha/admin/integracoes` para ver se as variáveis dos receptores Google Ads e Meta estão presentes, quantos recebimentos externos deduplicados foram registrados nos últimos 28 dias e a data do último recebimento. Variáveis presentes não comprovam conexão com a plataforma; o painel não revela segredos nem mede cliques ou visitas.

## Validação antes de depender do CRM como canal principal

- Cadastrar ao menos um gerente e dois corretores reais e verificar login, recuperação de senha, visualização isolada, atribuição, transferência e agenda em contas separadas.
- Confirmar um contato legítimo que tenha autorizado o cadastro: formulário → lead com origem → responsável → contato registrado → acompanhamento → relatório. Não criar leads fictícios na produção sem autorização.
- Ativar o Google Ads e a Meta em suas contas próprias; os endpoints do projeto não configuram sozinhos as plataformas nem suas credenciais. Verificar um recebimento real e a deduplicação antes de considerar o canal operacional.
- Revisar fila de leads existentes sem responsável e atrasados. Não ativar repasse automático de leads antigos sem regras de plantão e sem ciência da equipe.

## Limites desta entrega

O aviso ativo depende de o painel permanecer aberto e de conexão com a internet. Não há repasse automático por SLA, check-in de plantão, WhatsApp bidirecional, importação de portais, aplicativo nativo, isolamento de organizações ou cobrança de licenças. Nenhum desses recursos deve ser anunciado como operacional sem integração e validação em produção.
