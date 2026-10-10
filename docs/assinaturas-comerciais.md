# Ciclo comercial do Alpha

O login atual é individual. Contas internas da matriz têm `billingMode=INTERNAL` e não dependem de uma assinatura comercial. A modalidade `COMMERCIAL` é reservada para clientes/assentos comercializados e requer um registro `CommercialSubscription` ligado ao usuário.

- O teste individual dura 30 dias a partir do início registrado. O vencimento coincide com o fim do teste.
- Após o vencimento, há cinco dias completos de tolerância. No instante em que a tolerância termina, o painel administrativo e as APIs autenticadas negam acesso **somente** ao usuário comercial vencido. A página `/alpha/assinatura` informa o vencimento e, se houver um boleto pendente com URL HTTPS, oferece o link.
- O valor mensal fica em centavos no registro da assinatura e pode continuar vazio até a definição comercial. Não existe preço presumido. Pagamento confirmado prorroga a data por 30 dias, contando do maior valor entre o vencimento anterior e a data do pagamento.
- Um status de cobrança isolado não prova pagamento. A tabela `BillingPayment` reserva identificador e estado do provedor, mas **não há emissor de boleto, conciliação bancária ou webhook de pagamento implementados**. É necessário contratar/configurar um provedor antes de ativar cobranças reais e marcar pagamentos com confirmação autenticada.
- A modalidade comercial **não é criada na interface de usuários nesta etapa**. A separação por organização ainda não cobre todos os registros do catálogo, artigos, analítica e equipes; liberar clientes externos com papéis administrativos antes desse isolamento poderia expor dados de outras operações. O modo padrão `INTERNAL` preserva o acesso da matriz e da equipe atual após a migração.

Checklist antes de comercializar: isolar todas as entidades por organização, restringir consultas e mutações por escopo, definir os planos e valores, conectar um provedor de boleto/Pix, verificar webhooks assinados e idempotentes, emitir cobrança, confirmar pagamento real, testar vencimento/tolerância/bloqueio e reativação. O usuário que estiver bloqueado precisa ter um caminho de pagamento válido e funcional.
