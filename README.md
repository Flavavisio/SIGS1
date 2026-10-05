# SIGS1 — SIGS Studio

Aplicação de projeto para CCTV, intrusão e incêndio. Esta pasta contém o código completo, os testes e as migrações Supabase.

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
