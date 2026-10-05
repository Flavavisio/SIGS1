SIGS Design V6 — Estabilização

OBJETIVO
Consolidar o SIGS antes de adicionar novos módulos.

IMPLEMENTADO
- Catálogo principal efetivamente carregado no Supabase (176 produtos).
- Catálogo JavaScript mantido apenas como fallback.
- Removida a sincronização obrigatória no primeiro login do Super Admin.
- Autosave de projetos existentes: debounce ~7s e verificação periódica.
- Indicador Guardado / Por guardar / A guardar / Erro / Arquivado.
- Aviso ao fechar a página com alterações pendentes.
- Novo Projeto guiado com nome, módulo e dados do cliente.
- Estados: Rascunho, Ativo e Arquivado.
- Projeto arquivado protegido contra gravação acidental.
- Duplicar projeto.
- Gestor de projetos com pesquisa e filtro por estado.
- Histórico de versões e restauro.
- Snapshots automáticos no backend e versão manual ao Guardar.
- Novo Projeto disponível nos dashboards Admin e Comercial.
- Removido fisicamente o módulo Criminalidade PT da versão V6.
- Removida a camada antiga http://localhost:4000; cloud passa a ser Supabase.
- DORI, armazenamento, PoE/rede, BOM, orçamento, pisos, apresentação, catálogo e Verificador Técnico preservados.

FICHEIROS
- app-Sigs.html: versão modular recomendada.
- app-Sigs-standalone-v6.html: versão única para teste/distribuição.
- assets/: CSS, dados fallback e módulos JavaScript.
- supabase/: referência das migrações já aplicadas e estado verificado.

AINDA NÃO É V7
- Plantas continuam incorporadas no project_data; migração das plantas para Storage fica para fase seguinte.
- O Verificador Técnico pode ser aprofundado por regras específicas de CCTV/Ajax/EN54.
- BOM + preços + relatório comercial ainda podem ser unificados e refinados.
