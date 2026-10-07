# SIGS Studio — contas, acessos, visitas e SEO

## Funcionalidades
- A minha conta ao lado do Workspace: alteração da própria palavra-passe com campo atual, nova e confirmação, via Auth PUT /user com o token da sessão. Disponível a Super Admin, Admin e Comercial.
- Acessos e online, apenas Super Admin: todas as contas paginadas (100), estado ativo/online, última atividade e registo de início de sessão observado na app. Não inclui tentativas falhadas nem histórico anterior à instalação.
- Presença por sessão e separador, heartbeat de 45 segundos enquanto visível, limite de online de 120 segundos. É presença da app e não prova de atividade humana. Fechar um separador não desliga outro.
- Visitas: páginas públicas/da app sem parâmetros nem fragmentos, data, identificador aleatório por separador, IP, cidade/região aproximadas. Só após consentimento explícito, revogável pelo botão Privacidade. Sem nomes inferidos e sem freguesia/GPS.
- Geolocalização no IPWho.is, via HTTPS, com timeout e fallback indisponível. Endpoint gratuito sujeito a limite diário; não bloqueia uma visita em caso de falha. IP observado no cabeçalho encaminhado pela infraestrutura, não uma identidade verificada.
- Tabelas com RLS e SELECT exclusivo ao Super Admin. Escrita apenas pelo serviço, nunca diretamente pelo navegador. Edge valida Auth e perfil ativo para presença; valida Super Admin para dashboard. A rota visit é pública, exige consentimento/version e página permitida, com limitação básica por IP. O limite não substitui proteção anti-bot na infraestrutura.
- Limpeza diária: visitas de mais de 30 dias, acessos de mais de 90 dias, presenças de mais de 7 dias. Consulta no cron `sigs-activity-retention`.

## SEO
Domínio canónico: https://www.sigs-studio.pt/.
- Título e descrição, conteúdo introdutório, canonical, Open Graph/Twitter e JSON-LD Organization/WebSite/SoftwareApplication com preços atuais.
- robots.txt, sitemap.xml, 404.html e página de privacidade incluídos no build estático.
- App, propostas, acesso e registo com noindex. Permanecem rastreáveis para permitir ao motor ler a diretiva noindex. O robots.txt não é uma proteção de acesso.
- Sitemap apenas com URLs públicas canónicas. Sem avaliações fictícias ou promessa de posição.

Passo externo restante: verificar a propriedade www.sigs-studio.pt na Google Search Console e submeter https://www.sigs-studio.pt/sitemap.xml. Não foi submetida uma propriedade nem inventado um token de verificação. HTTPS e DNS do domínio devem estar operacionais. A indexação não é imediata nem garantida.

## Validação
`node tests/activity-v42.test.cjs`: handlers reais, perfis, confirmação, consentimento/recusa/retirada, exclusão dos tokens, 401/403 do handler Edge, metadados e build.
Validação RLS no Supabase: fixture em transação com rollback; Admin sem acesso, Super Admin com acesso, INSERT negado a authenticated.
Endpoint publicado: dashboard anónimo 401; visita sem consentimento 400; página inválida 400.
Nenhuma palavra-passe real alterada durante testes. Nenhum registo de utilizador real apagado.
