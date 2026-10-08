# SIGS Studio — contas, acessos, visitas e SEO

## Funcionalidades
- A minha conta ao lado do Workspace: alteração da própria palavra-passe com campo atual, nova e confirmação, via Auth PUT /user com o token da sessão. Disponível a Super Admin, Admin e Comercial.
- Acessos e online, apenas Super Admin: todas as contas paginadas (100), estado ativo/online, última atividade e registo de início de sessão observado na app. Não inclui tentativas falhadas nem histórico anterior à instalação.
- Presença por sessão e separador, heartbeat de 45 segundos enquanto visível, limite de online de 120 segundos. É presença da app e não prova de atividade humana. Fechar um separador não desliga outro.
- Visitas ao site dentro de Acessos e utilizadores online, apenas Super Admin: data/hora em Europe/Lisbon, página, totais 24h/7d/30d, filtro de período/página e paginação de 100 linhas.
- Visualizações públicas sem cookies, armazenamento local, identificador persistente do visitante, referrer, IP gravado ou geolocalização. Apenas início, registo, acesso e privacidade. Sem query strings/fragmentos. O UUID no campo legado `visitor_id` é criado no servidor para cada evento, não representa um visitante identificável nem permite contar pessoas únicas.
- O script respeita DNT/GPC. Uma página oculta só envia ao ficar visível. Um erro de estatísticas não interrompe a página. Páginas privadas não carregam este script.
- RLS e SELECT exclusivo ao Super Admin preservados; escrita apenas pela Edge Function. Histórico exige Auth válido e perfil ativo SUPER_ADMIN. Rota pública de escrita limitada a origens/páginas autorizadas e 30 pedidos/minuto por IP em memória, com mapa limitado. Este limite é por instância, não uma defesa global anti-bot.
- Tabelas e retenção existentes reutilizadas: visitas até 30 dias, acessos até 90 dias, presença até 7 dias, limpeza diária. Não há alterações de esquema ou permissões.

## SEO
Domínio canónico: https://www.sigs-studio.pt/.
- Título e descrição, conteúdo introdutório, canonical, Open Graph/Twitter e JSON-LD Organization/WebSite/SoftwareApplication com preços atuais.
- robots.txt, sitemap.xml, 404.html e página de privacidade incluídos no build estático.
- App, propostas, acesso e registo com noindex. Permanecem rastreáveis para permitir ao motor ler a diretiva noindex. O robots.txt não é uma proteção de acesso.
- Sitemap apenas com URLs públicas canónicas. Sem avaliações fictícias ou promessa de posição.

Passo externo restante: verificar a propriedade www.sigs-studio.pt na Google Search Console e submeter https://www.sigs-studio.pt/sitemap.xml. Não foi submetida uma propriedade nem inventado um token de verificação. HTTPS e DNS do domínio devem estar operacionais. A indexação não é imediata nem garantida.

## Validação
`node tests/activity-v42.test.cjs` e `node tests/pageviews-v57.test.cjs`: alteração da própria password, isolamento de perfis, pesquisa/paginação/ordenação do histórico, resposta atrasada, 401/403, validação de origem/página, exclusão de dados identificadores, limites de escrita, DNT/GPC e metadados SEO.
Validação Supabase: permissões/RLS e cron de retenção confirmados; rota pública, leitura não autorizada e gravação anónima verificadas após publicação.

## Histórico das alterações
Em 7 de outubro foi retirado o aviso e desativada a recolha pública. Em 9 de outubro o histórico foi reposto no painel de acessos, com visualizações mínimas sem cookies/identificação persistente e sem repor o aviso anterior. Não é possível recuperar visitas não recolhidas durante o período desativado.
