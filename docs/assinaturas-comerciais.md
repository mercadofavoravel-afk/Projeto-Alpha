# Ciclo comercial do Alpha

O login atual é individual. Contas internas da matriz têm `billingMode=INTERNAL` e não dependem de uma assinatura comercial. A modalidade `COMMERCIAL` é reservada para clientes/assentos comercializados e requer um registro `CommercialSubscription` ligado ao usuário.

- O plano comercial custa **R$ 100 por mês** (`10000` centavos). Esse valor é definido no código como `commercialMonthlyPriceCents`.
- O teste individual dura 30 dias a partir do início registrado. O vencimento coincide com o fim do teste.
- Após o vencimento, há cinco dias completos de tolerância. No instante em que a tolerância termina, o painel administrativo e as APIs autenticadas negam acesso **somente** ao usuário comercial vencido. A página `/alpha/assinatura` informa o vencimento e, se houver uma cobrança pendente com URL HTTPS, oferece o link.
- Pagamento confirmado prorroga a data por 30 dias, contando do maior valor entre o vencimento anterior e a data do pagamento.
- `lib/billing-provider.ts` define um contrato adaptável para provedores de cobrança. A interface cobre cobrança via Pix e boleto, chave de idempotência na criação e normalização de webhooks após validação de assinatura. O provedor ainda não foi escolhido; não há integração com fornecedor, emissor de cobrança, conciliação bancária ou webhook ativos. Não emitir cobranças reais até selecionar e configurar um provedor e testar a validação de ponta a ponta.
- Um status de cobrança isolado não prova pagamento. A tabela `BillingPayment` reserva identificador e estado do provedor; somente uma confirmação autenticada e idempotente deve marcar o pagamento como quitado.
- A modalidade comercial **não é criada na interface de usuários nesta etapa**. A separação por organização ainda não cobre todos os registros do catálogo, artigos, analítica e equipes; liberar clientes externos com papéis administrativos antes desse isolamento poderia expor dados de outras operações. O modo padrão `INTERNAL` preserva o acesso da matriz e da equipe atual após a migração.

Checklist antes de comercializar: isolar todas as entidades por organização, restringir consultas e mutações por escopo, escolher e configurar um provedor que atenda ao fluxo Pix/boleto, emitir uma cobrança de teste, validar assinatura e idempotência dos webhooks, confirmar um pagamento real, testar vencimento/tolerância/bloqueio/reativação e garantir um caminho de pagamento válido para usuários bloqueados.
