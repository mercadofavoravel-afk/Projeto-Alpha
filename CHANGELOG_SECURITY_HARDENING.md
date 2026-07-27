# Security hardening

## Alterações

- Limite de tentativas de login por conta e por IP.
- Cabeçalhos de proxy somente são considerados quando explicitamente confiáveis.
- Envio de e-mail de recuperação de senha em produção via Resend.
- Permissões específicas adicionadas aos endpoints administrativos de books, leads e empreendimentos.
- CI ampliado para executar lint e testes.
- Remoção da variável `SESSION_SECRET`, que não era usada pela estratégia de sessão.
- README e exemplo de ambiente atualizados.

## Configuração necessária em produção

- `APP_URL`
- `EMAIL_FROM`
- `RESEND_API_KEY`
- `TRUST_PROXY_HEADERS=true` apenas atrás de proxy confiável
- `LOGIN_MAX_IP_ATTEMPTS`
