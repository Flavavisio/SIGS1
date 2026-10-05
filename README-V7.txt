SIGS Design V7 — Engenharia

Principais alterações:
- Verificador técnico aprofundado para CCTV, Ajax e Ajax EN54.
- Validação por piso: planta, escala e Storage.
- CCTV: DORI/ótica, bitrate estimado, PoE estimado, cabos, retenção, NVR, armazenamento, PoE e uplink.
- Intrusão Ajax: Hub, capacidade estruturada quando disponível, sirenes e repetidores.
- Incêndio EN54: central, bateria/autonomia selecionada, botões manuais, sinalização e deteção.
- Plantas de projetos cloud passam a ser enviadas para o bucket privado project-files.
- project_data guarda o caminho/metadata da planta em vez do base64 quando a planta está no Storage.
- RLS de project_files reforçada para respeitar as permissões do projeto.
- NVR e switches passam a ser carregados do catálogo Supabase.
- HDD de dimensionamento passam a existir como capacidades técnicas no catálogo Supabase.
- BOM usa referência de catálogo para HDD.
- Catálogo Super Admin suporta também NETWORK e STORAGE.

Supabase V7:
- 220 produtos ativos no catálogo após a migração.
- +12 NVR, +20 switches PoE e +12 capacidades HDD.
- project_files com floor_id e metadata.
- Plantas guardadas em <company>/<project>/floorplans/.

Nota:
As referências HDD-SURV-* são capacidades técnicas genéricas de projeto, não modelos comerciais de um fabricante. Devem ser substituídas por SKUs comerciais quando forem definidos os fornecedores/preços.
