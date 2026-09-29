# Senha e recuperação de acesso — Projeto Alpha

## Fluxos disponíveis

- **Conta autenticada:** `/alpha/admin/minha-conta`, acessível por **Senha e segurança** no menu e pelo atalho da visão geral. A pessoa informa a senha atual, uma senha nova de 12 a 128 caracteres e a confirmação. A troca encerra todas as sessões e descarta links de recuperação anteriores.
- **Senha esquecida:** `/alpha/login` → **Esqueci minha senha** → `/alpha/recuperar-senha`. A pessoa informa o e-mail da própria conta e recebe um link para `/alpha/redefinir-senha`. O link dura 30 minutos e só pode ser usado uma vez. Uma nova senha encerra todas as sessões e invalida outros links.
- Os dois fluxos servem a todos os papéis da tabela `User` (administrador, diretor, gerente, corretor e demais funções). Contas inativas não recebem links nem podem usá-los. Uma solicitação repetida dentro de três minutos preserva o link anterior e evita novo e-mail. A tela não confirma se uma conta existe.

## Dependência de produção

A recuperação por e-mail exige, no ambiente **Production** do projeto Vercel que atende ao domínio público:

- `RESEND_API_KEY`: credencial de envio mantida exclusivamente no gerenciador de segredos, nunca no repositório ou em mensagens.
- `EMAIL_FROM`: remetente pertencente a domínio verificado no serviço de e-mail.
- `PASSWORD_RESET_EMAIL_ENABLED=true`: habilite somente depois de confirmar a
  verificação do domínio de envio e o recebimento de um e-mail real. Enquanto a
  verificação DNS estiver pendente, a tela informa indisponibilidade em vez de
  sugerir que enviou um link que o provedor recusará.

O endereço do link usa `NEXT_PUBLIC_SITE_URL` já configurado; `APP_URL` pode substituir esse endereço se necessário. Depois de definir as variáveis, é preciso fazer novo deploy de produção. Até que um e-mail real seja recebido e seu link seja usado com sucesso, o fluxo por e-mail **não está operacional**.

## Validação antes de liberar contas comerciais

1. Com conta ativa controlada pela equipe, solicitar um link e conferir recebimento na caixa de entrada ou spam; conferir que o endereço abre a página do próprio domínio `/alpha/redefinir-senha`.
2. Trocar a senha pelo link e entrar com a nova senha; conferir que a senha antiga e sessões anteriores não funcionam.
3. Tentar reutilizar o link e conferir que é recusado.
4. Entrar em **Senha e segurança**, alterar a senha com a senha atual e conferir que a sessão anterior é encerrada.
5. Repetir com os papéis efetivamente habilitados na operação. Não enviar tokens, senhas ou links de recuperação para chamados ou relatórios.

O modelo atual tem e-mail único global e **ainda não implementa isolamento por empresa/tenant**. Antes de vender licenças para organizações independentes, a identidade, a autenticação e os links de recuperação precisam usar o modelo de empresas do produto; esta funcionalidade não deve ser anunciada como multiempresa pronta.
