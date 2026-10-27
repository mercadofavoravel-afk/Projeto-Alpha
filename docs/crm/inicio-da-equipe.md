# Começar a operação da equipe

## 1. Acesso e profissionais

Acesse `/alpha/login` com sua conta de administrador ou diretor. Em `/alpha/admin/usuarios`, cadastre cada gerente e corretor com e-mail individual e função correta. Vincule o corretor ao gerente, defina capacidade, regiões e se está habilitado a receber leads. Confira o resultado do envio do acesso; cadastro salvo não comprova que o e-mail chegou. Cada profissional deve entrar com sua própria conta.

## 2. Leads e carteira

Em `/alpha/admin/leads`, confira contatos sem responsável e os filtros por profissional. Atribua ou transfira pela ficha do lead quando necessário. A ficha mantém o histórico. O corretor registra o contato efetivamente realizado e agenda a próxima ação; mover o estágio não comprova atendimento. Os acompanhamentos aparecem em `/alpha/admin/agenda`.

## 3. Cadastro manual e importação

Abra `/alpha/admin/leads/entrada` com ADMIN ou DIRECTOR. Informe um nome que identifique a origem da lista. Para um contato, preencha o formulário manual. Para planilha, use CSV ou XLSX, primeira aba, até 3 MB, 2.000 contatos e 50 colunas.

Colunas reconhecidas automaticamente: Nome, Telefone, E-mail, Bairro e Observações. Nome e telefone são obrigatórios. Se os títulos forem diferentes, ajuste o mapeamento. Confira a prévia e as linhas rejeitadas antes de confirmar. A importação deduplica por telefone/e-mail e preserva os dados do contato já existente. Não marque consentimento sem ter o registro correspondente.

## 4. Preparar repique

Na importação, ative a opção de preparar fila, selecione os profissionais e o intervalo. A fila é criada pausada. No modo individual, entrega um lead por intervalo, alternando os elegíveis. No modo rodada, entrega até um lead para cada profissional elegível por intervalo. A primeira entrega acontece depois do intervalo escolhido.

Confira regiões, capacidade e habilitação dos selecionados antes de iniciar. Leads ganhos, perdidos ou alterados depois da preparação são preservados conforme as regras da fila. Sem corretor elegível, os itens permanecem pendentes. A tela mostra contagens e histórico recente. Pausar interrompe novas entregas; não desfaz atribuições anteriores.

O repique atribui contatos dentro do CRM. Não dispara automaticamente WhatsApp, SMS ou e-mail para o cliente.

## 5. Conferência final com a gestão

1. Entrar com gestor e corretor em contas distintas e conferir o isolamento das carteiras.
2. Cadastrar ou importar um contato real autorizado, conferir a prévia e a origem na ficha.
3. Preparar uma fila pequena, revisar os profissionais e iniciar no intervalo desejado.
4. Conferir responsável, histórico e atividade após a entrega.
5. Registrar o primeiro contato e um acompanhamento com data, conferindo a agenda.

O funcionamento com painel fechado depende do agendador de servidor por minuto e de heartbeat recente. Até a ativação e a observação desse agendador, não depender desse modo para a operação. O pulso da tela aberta é complementar.
