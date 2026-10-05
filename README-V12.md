# SIGS Studio V12

Abrir `app-Sigs.html` e escolher **O meu trabalho** na navegação ou no portal. **Verificar** abre a revisão do projeto atual. O index existente mantém os planos definidos.

| Ferramenta | Implementação |
|---|---|
| Modelos | Moradia, loja, armazém e escritório nas três especialidades. Só aplicam a projeto vazio; posições ilustrativas. |
| Verificação | Planta/escala, referências e preços em falta, canais/resolução/banda/baias NVR, potência/portas PoE e limite de equipamentos. |
| Alternativas | Económica, Recomendada e Premium com preços, margem, desconto e mão de obra editáveis e cálculo comparável. Começam iguais; não inventam diferenças técnicas. Aplicação bloqueada se os materiais/quantidades entretanto mudarem. |
| Catálogo CSV | Ficheiro ou URL HTTPS, associação de colunas, pré-visualização, validação e confirmação. Custo, PVP, stock e imagens por empresa. Aplicação dos preços é explícita. Novas referências podem ser adicionadas como materiais; CSV de preços não inventa especificações para colocar equipamentos na planta. |
| Clientes | Fichas da empresa com contactos/notas, associação ao projeto e lista de propostas. Estados internos e respostas do cliente apresentados separadamente. |
| Duplicação | Pisos com cópia independente dos dispositivos e identificadores; usa a duplicação cloud existente para instalações completas. |
| Revisões | Propostas comerciais fixas, numeração concorrente em PostgreSQL e comparação de quantidades, venda, total e condições. |
| Partilha | `proposta.html#token=…`, token aleatório de 256 bits, hash no servidor, prazo 1–90 dias, revogação e uma única resposta (aceitar, recusar, pedir alteração). |
| Painel | Projetos recentes, propostas por concluir/enviadas/aprovadas e acesso ao projeto. As respostas públicas não sobrescrevem automaticamente o estado interno. |
| Marca | Logo/cor/contactos/condições/validade por empresa. Admin altera padrões; novos projetos carregam os padrões e projetos existentes podem aplicá-los explicitamente. Propostas usam a identidade configurada. |

## Dados e acesso

Estrutura V12 aplicada no Supabase SIGS. Todas as novas tabelas têm RLS. Dados empresariais ficam por empresa; revisões/links seguem o acesso ao projeto. Anónimo não pode ler diretamente as tabelas. Os dois endpoints por token só devolvem campos públicos e permitem registar uma resposta uma vez. Custos, margens e dados internos do projeto não são publicados. SQL de referência: `supabase/V12_workflow_schema.sql`.

Os links dão acesso a quem os possui. Partilhar apenas com o destinatário. A resposta regista nome indicado e data, não é uma assinatura digital. Criar um link não envia email. O site precisa de hosting HTTPS para o destinatário aceder à página; hosting ainda não configurado nesta entrega. Token não recuperável no servidor: copiar o link após criação ou gerar outro.

Plantas do Storage são incorporadas na revisão para não dependerem de URLs temporários. Limite 2,5 MB por planta e cerca de 7,5 MB por revisão. Logo até 2 MB. Imagens indisponíveis ou demasiado grandes bloqueiam a criação da revisão em vez de criar um link incompleto.

CSV até 5 MB e 1000 referências; URL externa precisa de CORS. A atualização é manual. Preços em branco conservam os valores anteriores. A alteração do catálogo não altera silenciosamente propostas já guardadas.

## Verificação

`node tests/workflow-v12.test.cjs`
`node tests/commercial-v8.test.cjs`
`node tests/proposal-v10.test.cjs`
`node tests/landing-v11.test.cjs`

Testados 12 modelos, cópias independentes, privacidade/escaping da proposta pública, comparação, CSV, avisos técnicos, cálculo e sintaxe. `tests/backend-v12.sql` executado na base real dentro de transação com rollback: escrita/leitura autenticada, rejeição entre empresas, revisão, campos públicos permitidos, token inválido, resposta única e revogação. Nenhum registo de teste ficou guardado.

Advisors: sem alertas novos das tabelas/funções V12. Existem avisos anteriores sobre as funções públicas de histórico técnico e proteção de passwords comprometidas:
- https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

Validação visual e interação completa numa sessão real do navegador pendentes. Não foi configurado hosting.
