# SIGS1 — SIGS Studio

Aplicação de projeto para CCTV, intrusão e incêndio. Esta pasta contém o código completo, os testes e as migrações Supabase.

## Atualização V32

- Registo público em registo.html: plano, pessoa/empresa, contacto, email e palavra-passe. Links no index e no login.
- Supabase Auth cria a identidade. Trigger privado, apenas na criação, atribui ADMIN no novo espaço e configura a licença; ignora roles, estados ou IDs de empresa enviados pelo cliente.
- Free fica ACTIVE sem prazo e sem aprovação. Express/Pro/Supreme ficam PENDING e só o Super Admin os aprova; o período inicia na aprovação.
- Ecrã de espera para planos pagos. Registo requer confirmação do email segundo a configuração atual de Auth. A entrega real do email não foi testada.
- Testes do registo e da aprovação feitos com fixtures em transação revertida; nenhum email de teste foi enviado.

## Atualização V31

- Index com Gratuito, Express 4,99 €, Pro 9,99 € e Supreme 19,99 € por mês.
- Preços dos planos pagos com indicação de IVA não incluído.
- Supreme: acesso completo, projetos ilimitados por empresa e 200 equipamentos por projeto.
- Plano configurado no Supabase e nas opções de atribuição/alteração de licença. Recomendação de plano inclui Supreme.

## Atualização V30

- Histórico fecha pelo botão, Escape e clique fora, incluindo durante o carregamento.
- Gravação automática de 10 em 10 minutos, enquanto o projeto está aberto e há alterações; a edição contínua não adia o intervalo.
- Gravações manuais preservadas em separado das cópias automáticas. Filtros Todas, Manuais e Automáticas.
- Retomar gravação protege primeiro o estado atual (incluindo alterações ainda não gravadas) numa cópia PRE_RESTORE.
- Atualização e checkpoint numa transação; falhas não são apresentadas como gravações confirmadas. Alterações feitas durante uma gravação continuam pendentes.
- SQL aplicado: supabase/V30_project_checkpoints.sql. Verificação autenticada e restauro executados em transação revertida.

## Atualização V29

- Cabos: duplo clique num ponto prolonga o percurso até ao gravador; clicar diretamente no gravador termina nesse ponto. Sem gravador definido, o percurso permanece em edição.
- Paredes: cada clique acrescenta um segmento; duplo clique termina a parede. Concluir e Cancelar continuam disponíveis.
- Referências de pessoa e carro, com posição, dimensões e orientação guardadas por piso e suporte a desfazer.
- Vista 3D da câmara selecionada, calculada com escala, FOV/focal, posição, altura e inclinação. Modelos geométricos simplificados; não é uma simulação fotográfica ou de reconhecimento.

## Atualização V22

- **Proposta comercial:** âmbito, equipamentos e serviços, valores, condições de execução e pagamento, validade e aceitação pelo cliente. Os custos internos não são publicados.
- **Relatório técnico:** plantas, cobertura estimada, inventário, focais, altura e inclinação das câmaras, zona cega, banda de rede, armazenamento, potência PoE e checklist da instalação. Não inclui preços nem condições comerciais.
- Capturas do mapa e importações de planta ficam automaticamente bloqueadas. O utilizador pode desbloquear deliberadamente para ajustar a planta.
- Capturas sem mosaicos válidos não substituem a planta existente; capturas parciais apresentam um aviso. A escala do mapa é calculada automaticamente.

## Publicação estática

Executar `node scripts/build-static.cjs` para gerar `dist/`. Publicar o conteúdo de `dist/` no servidor. Para GitHub Pages, também é possível publicar a raiz de `main`, que contém `index.html`, `app-Sigs.html` e `assets/`.

Ativar Pages em **Settings → Pages → Deploy from a branch → main → / (root)**. A configuração depende das permissões da conta GitHub. Para usar recuperação de conta nesse domínio, autorizar também os redirects exatos `https://flavavisio.github.io/SIGS1/acesso.html` e `https://flavavisio.github.io/SIGS1/app-Sigs.html` em Supabase Auth → URL Configuration. O script `scripts/configure-email-auth.mjs` inclui os novos endereços; precisa do token de gestão da conta.

## Verificação

Os testes estão em `tests/` e executam-se com Node.js, sem instalação de dependências. Executar cada ficheiro `*.test.cjs` e `*.test.mjs`. A V22 passou nas 13 suites automatizadas, incluindo documentos, captura e bloqueio, ótica, preços, especialidades, projetos, Workspace e processamento de emails com serviços simulados. Passaram também as três verificações SQL no Supabase: isolamento entre empresas e partilha de propostas, fila de emails e nomes de projetos. Os dados de teste foram revertidos.

Os testes automatizados não substituem uma validação visual no navegador, testes de instalação no local ou entrega de emails reais. A entrega de emails depende da configuração SMTP descrita em `README-EMAILS-V15.md`. O relatório inclui estimativas de projeto, não uma certificação da instalação.

Consultar `README-V12.md` para o funcionamento do Workspace e do backend.

## Identidade V23

SIGS Studio — **Segurança bem projetada.** Logótipo em `assets/brand/sigs-studio-logo.png`. Identidade aplicada ao index, app, acesso, Workspace, apresentações, propostas, relatórios e aos 15 modelos de email. Os documentos mantêm a marca da empresa e acrescentam a assinatura **by SIGS Studio**.

O serviço de emails de licença usa o novo modelo. Para atualizar os emails de autenticação já configurados no Supabase, executar `node scripts/configure-email-auth.mjs` com o token de gestão, ou copiar os modelos de `supabase/email-templates/` em Auth → Email Templates. Não existe token de gestão disponível neste ambiente; gerar os modelos não altera os templates remotos de Auth.

## Recomendações V24

O separador Sistema sugere gravador, discos e switch conforme a marca das câmaras de todos os pisos. A marca preferida e as escolhas de gravador e switch são guardadas no projeto; o orçamento usa as mesmas referências e quantidades. A prioridade de marca só é aplicada a soluções dimensionadas para canais, resolução, banda, armazenamento/baias, portas, potência com reserva e uplink. Projetos mistos, alternativas de outra marca e especificações ausentes têm avisos de confirmação. A seleção não certifica ONVIF nem garante funções proprietárias. A capacidade de discos em TB decimal é convertida para GiB ao comparar com o cálculo de retenção.

## Pendências V25

O botão Pendências abre as tarefas por piso e as revisões técnicas/comerciais, com ações diretas para planta, escala, orçamento, biblioteca e sistema. A cobertura é confirmada pelo utilizador e a confirmação perde validade se a base, escala, posições ou parâmetros óticos mudarem. Esta revisão não certifica cobertura no local.

## Alternativas V26

Económica, Recomendada e Superior começam na mesma base, sem diferenças técnicas ou descontos inventados. Cada cenário guarda o projeto e as suas condições; o utilizador pode editar equipamentos na planta e atualizar a alternativa. Aplicar um cenário recupera o projeto, mantém a identidade atual do cliente e verifica especialidade e limite do plano. É possível restaurar o estado anterior. A comparação para o cliente inclui descrições, materiais, IVA e condições, sem custos internos. Preços e descrições incompletos impedem a exportação.

### V27 — proposta e acesso aos projetos
- FOV e orientação de cada câmara na planta e legenda da proposta PDF e partilhada; os setores usam a escala guardada e os parâmetros da focal.
- Logo da empresa e SIGS Studio no cabeçalho do relatório técnico.
- Criação e partilha de revisões corrigidas para Super Admin com as mesmas restrições de licença, projeto e privacidade; aplicar `supabase/V27_proposal_fov_and_revisions.sql` numa instalação anterior.
- Abrir projetos junto de Novo projeto nas quatro ferramentas e no assistente; filtragem por empresa e especialidade.
- Testes de handlers de revisão, FOV e integração PostgreSQL com transações revertidas.

### V28 — paredes e cablagem
Paredes abertas e obstáculos poligonais opacos por piso recortam o FOV em planta. Não considera altura, transparência nem propagação de radar. A revisão de cobertura é invalidada ao mudar obstáculos.
Percursos editáveis por equipamento, com escala do piso, altura de instalação, folga fixa e percentual. Cancelar preserva o percurso anterior. Os desenhos e folgas são guardados no projeto, acompanham desfazer e alternativas e atualizam a quantidade de cabo no orçamento. Cabos de intrusão/incêndio usam referências genéricas a confirmar.
O painel Paredes e cablagem fica na barra lateral. Parede: dois extremos. Obstáculo: pelo menos três pontos e Concluir. Cabo: selecionar equipamento, marcar vértices e Concluir (Enter no computador). Escape cancela. PDF e propostas partilhadas mostram as paredes e percursos sem divulgar preços internos. Aplicar `supabase/V28_public_geometry.sql` para a lista pública de campos.


## V34 — Projetos e emails por Edge Functions

Abrir projetos, no launcher, no assistente e no Workspace, regressa ao painel de projetos da empresa para Admin/Comercial, sem apagar o projeto atual nem as alterações em memória. O Super Admin mantém a lista de gestão com filtro por módulo.

`sigs-auth-email` é um Send Email Hook HTTPS com assinatura Standard Webhooks. Usa os layouts partilhados para ativação, convites, recuperação e avisos de segurança. Os destinatários e os links são validados; mudanças de email seguras usam o mapeamento correto de hashes atual/novo. Não imprime tokens nem credenciais. O setup está em `supabase/AUTH_EMAIL_EDGE_SETUP.md`. O hook só deve ser ligado depois de os secrets serem configurados; o SMTP de Authentication mantém-se até essa mudança.

Validação: 26 suites Node passaram; build estático e sintaxe JavaScript verificados. Função publicada; configuração do hook/secrets e entrega real pendentes.

## V35 — Painéis de referências e emails aplicados

Os painéis Pessoa, carro e vista 3D e Paredes e cablagem atualizam as ferramentas sempre que são abertos. Se a barra lateral for instalada antes de existir um piso, mostra orientação para abrir/criar um projeto; ao abrir já num projeto, apresenta os controlos do piso atual. Teste de regressão cobre instalação antes do projeto, colocação real de pessoa/carro, conclusão de parede e troca de piso.

Os oito templates Auth de ativação, convite, login, mudança de email, recuperação, código e avisos de password/email foram aplicados no painel Supabase. As duas notificações de segurança ficaram ativas. Site URL e seis destinos exatos de retorno foram configurados para o Site e GitHub Pages. O logótipo dos quinze modelos usa o PNG público do repositório SIGS1, também confirmado como image/png acessível sem login. Auth continua a enviar por SMTP enquanto o Send Email Hook não tiver os secrets configurados e for ativado. Entrega e renderização na caixa de entrada não são comprovadas pelos testes locais.

Validação: 27 suites Node passaram. Templates reconstruídos e função de emails de licença atualizada.

## V36 — Visibilidade, profundidade 3D e abertura de projetos

Corrigida uma diferença de 90° entre os setores desenhados no canvas e os raios usados para cortar a cobertura nas paredes. CCTV, térmicas, radar, proposta e vista 3D usam agora a direção de referência consistente: 0° para cima, 90° para a direita. Paredes atrás da câmera ou fora do cone não reduzem o alcance.

A vista 3D resolve a superfície mais próxima por pixel, com interpolação de profundidade em perspetiva, em vez de ordenar faces pela distância média. A avaliação do centro de pessoas/carros considera a altura indicada para as paredes. A cobertura em planta continua a representar paredes opacas em 2D.

Corrigida a atualização do título da janela de projetos, que podia substituir um contentor e apagar os seus controlos. A janela abre também acima do portal. Alterações feitas imediatamente após abrir/retomar um projeto mantêm o estado Por guardar; callbacks de apresentação já não substituem a referência de gravação.

Validação local: 29 suites Node passaram, incluindo regressões com o drawCov real, paredes fora do FOV, altura de parede, superfícies cruzadas e alterações rápidas após retomar. Build estático e sintaxe verificados. Estes testes não equivalem a validação física no iPhone nem a receção de emails numa caixa de entrada.
