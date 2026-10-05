# Emails do SIGS Studio

Implementação em português de Portugal com 15 modelos: recuperação, convite, confirmação, acesso por link, alteração de email, código de verificação, palavra-passe alterada, email alterado, boas-vindas e seis eventos de licença (ativação, renovação, vencimento, expiração, suspensão e reativação).

## Estado

- Recuperação disponível no login através de `acesso.html`; validação do link, palavras-passe iguais, remoção dos tokens do URL e pedido de revogação das outras sessões após guardar.
- Templates HTML e payload para a configuração oficial do Supabase Auth em `supabase/email-templates`. **Criar estes ficheiros não altera os templates hospedados do Auth.**
- Base de dados atualizada: fila privada com RLS, eventos automáticos e agendamento de avisos aos 7, 3 e 1 dias do vencimento. Os destinatários de licença são os administradores ativos da empresa; o email da empresa é usado quando ainda não existe administrador ativo. Não são guardadas passwords, tokens de recuperação nem chaves de licença.
- Função `sigs-email-worker` publicada com autenticação obrigatória. Só Super Admin ou o serviço interno podem consultar/operar o transporte. Os envios permanecem desativados até a configuração e verificação do SMTP.
- Os modelos e a pré-visualização ficam no código, sem acesso visível no portal. A galeria pública `emails.html` foi retirada.
- Não foi enviado nenhum email real para validar esta implementação.

## Ativar autenticação

1. Em Supabase Auth, configurar SMTP próprio e remetente «SIGS Studio».
2. Aplicar os oito templates de autenticação/segurança de `supabase/email-templates`, com os assuntos em `auth-config.json`. Ativar notificações de palavra-passe e email alterados.
3. Autorizar os redirects exatos `https://sigs-studio.flowy-mouse-8040.chatgpt.site/acesso.html` e `https://flavavisio.github.io/SIGS1/acesso.html`, além dos correspondentes `app-Sigs.html`. O callback da app encaminha links antigos de recuperação/convite para o novo ecrã.
4. Alternativamente, `node scripts/configure-email-auth.mjs` aplica os modelos e redirects preservando os existentes, quando `SUPABASE_ACCESS_TOKEN` está disponível no ambiente. As cinco variáveis SMTP abaixo são opcionais neste script, mas devem ser fornecidas em conjunto. O script não imprime nem grava credenciais.

## Ativar avisos de licença e boas-vindas

Guardar nos secrets das Edge Functions:

| Variável | Valor |
|---|---|
| `SMTP_HOST` | Servidor do fornecedor |
| `SMTP_PORT` | `465` (TLS) |
| `SMTP_USER` | Utilizador SMTP |
| `SMTP_PASSWORD` | Palavra-passe SMTP/de aplicação |
| `SMTP_FROM` | Endereço remetente autorizado |
| `SMTP_REPLY_TO` | Opcional, endereço de apoio |
| `SIGS_APP_URL` | Opcional, URL HTTPS da app |
| `SIGS_EMAIL_ENABLED` | `true` apenas depois de verificar a ligação |

Invocar a função autenticado como Super Admin com `{"action":"verify"}` confirma o transporte sem enviar emails. Colocar no Vault o JWT `service_role` deste projeto com o nome `sigs_email_worker_jwt` para o cron conseguir invocar a função. Este segredo nunca deve ser colocado no frontend ou no repositório. O cron verifica a fila a cada cinco minutos; sem o segredo fica inativo.

Antes de ativar, rever a fila acumulada e cancelar mensagens que já não sejam pertinentes. Alterações de estado e renovações cancelam avisos anteriores pendentes dessa licença. Uma falha ou entrega incerta precisa de inspeção; não há reenvio automático que possa duplicar mensagens após um timeout. Aceitação pelo servidor SMTP não comprova entrega na caixa de entrada.

Supabase Edge Functions não permite ligações de saída nas portas 25 ou 587. Para os avisos usa-se SMTP 465 com TLS e validação de certificado; a configuração do SMTP do Supabase Auth é independente.

## Validação

`node tests/emails-v15.test.mjs`: modelos, escaping, URLs, recuperação, links expirados, limite de pedidos, confirmação da palavra-passe e logout global.

`tests/backend-emails-v15.sql`: transação revertida com eventos, deduplicação, restrições de acesso, RLS e isolamento do lease de entrega. Não ficam utilizadores ou mensagens de teste na base de dados.

Documentação: [Email templates](https://supabase.com/docs/guides/auth/auth-email-templates), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [limites das Edge Functions](https://supabase.com/docs/guides/functions/limits).
