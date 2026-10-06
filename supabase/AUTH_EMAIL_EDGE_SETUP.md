# Emails do SIGS Studio por Edge Functions

O serviço `sigs-email-worker` envia as notificações de licença. O novo `sigs-auth-email` usa os mesmos layouts para ativação, convites, recuperação, login por link, mudança de email, códigos e avisos de segurança da conta.

## 1. Configurar os secrets

Em https://supabase.com/dashboard/project/kbihedvyykjlbnipdgfm/functions/secrets adicionar:

| Name | Value |
| --- | --- |
| SMTP_HOST | smtp.gmail.com |
| SMTP_PORT | 465 |
| SMTP_USER | Geral.sigs.studio@gmail.com |
| SMTP_FROM | Geral.sigs.studio@gmail.com |
| SMTP_PASSWORD | A palavra-passe de aplicação Google, colocada diretamente no Supabase |
| SIGS_EMAIL_ENABLED | true |

A configuração de SMTP em Authentication não preenche estes secrets. Não colocar palavras-passe no código, GitHub ou mensagens.

## 2. Configurar o Send Email Hook

Em https://supabase.com/dashboard/project/kbihedvyykjlbnipdgfm/auth/hooks criar um **Send Email** hook HTTPS:

`https://kbihedvyykjlbnipdgfm.supabase.co/functions/v1/sigs-auth-email`

Gerar o segredo de assinatura no Supabase e colocá-lo nos secrets com o nome `SEND_EMAIL_HOOK_SECRET`. O valor completo gerado, incluindo o prefixo `v1,whsec_`, é aceite pela função.

Guardar o secret antes de ativar o hook. A função recusa pedidos sem uma assinatura válida. A verificação de JWT da função fica desativada porque o Auth autentica o hook através dessa assinatura, não de uma sessão de utilizador.

Enquanto o hook estiver desativado, os emails de autenticação continuam a usar o SMTP do Auth. Quando for ativado, o hook passa a ser o responsável pelo envio. Não eliminar o SMTP existente durante a configuração.

## 3. Verificar

Criar um registo Free com um email real de teste, receber **Ativar conta**, clicar e iniciar sessão. Confirmar também a recuperação de palavra-passe. Não enviar tokens ou passwords para os logs.

O envio de teste real e a ativação do hook não foram efetuados automaticamente: os secrets e a configuração de Auth não estão disponíveis através da ligação usada nesta sessão. O Gmail precisa de responder dentro do prazo curto do hook; se houver timeouts recorrentes, rever o transporte.

Documentação: https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
