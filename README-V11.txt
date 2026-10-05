SIGS Studio V11 — Novo index e planos

ENTRADA
Abrir index.html. Página autónoma, sem fontes, bibliotecas ou imagens externas.
Os botões de acesso abrem app-Sigs.html; manter a pasta assets e a aplicação no mesmo diretório.
Os parâmetros ?plan= são indicativos; não criam subscrições nem iniciam pagamentos.

INTERAÇÃO
Demonstração de CCTV, intrusão e incêndio com planta, equipamentos selecionáveis, materiais e proposta.
Quantidades e valores da demonstração são ilustrativos. Não afetam os projetos reais.
Comparador de planos por projetos e equipamentos. Navegação móvel, teclado e redução de movimento.

PLANOS APRESENTADOS
Gratuito: 0 €/mês, 1 projeto por empresa, 15 equipamentos por projeto.
Express: 4,99 €/mês, 10 projetos por empresa, 50 equipamentos por projeto.
PRO: 9,99 €/mês, 50 projetos por empresa, 100 equipamentos por projeto.
Express mantém os limites anteriores. Não foram definidos valores anuais nem tratamento fiscal da subscrição.
Configuração de referência: assets/data/plans-v11.json.
A aplicação continua a consultar os limites no Supabase. O projeto SIGS está ACTIVE_HEALTHY. Preços mensais e limites atualizados e confirmados na tabela public.plans em 2026-10-04.
Os valores anuais e o plano CUSTOM foram mantidos. Não foi alterada a estrutura da base de dados.
O index e a aplicação foram colocados na branch main de Flavavisio/Sigs. Hosting público não configurado nesta entrega.


VALIDAÇÃO
node tests/landing-v11.test.cjs
node tests/commercial-v8.test.cjs
node tests/proposal-v10.test.cjs
Sintaxe e referências locais verificadas. Validação visual em navegador e sessão Supabase pendentes. Não publicado.

Inclui a aplicação V10 com acessórios sugeridos e proposta completa. Ver README-V10.txt.
