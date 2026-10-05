SIGS Studio V10 — Acessórios sugeridos e proposta completa

Entrada: app-Sigs.html (com pasta assets) ou app-Sigs-standalone-v10.html.

ACESSÓRIOS
Abrir Materiais e orçamento > Acessórios sugeridos.
Sugestões genéricas de caixas, terminações de rede, organização de cabos, fixação de intrusão e identificação de incêndio consoante os equipamentos.
Adicionar uma sugestão é uma ação explícita; não altera o orçamento automaticamente antes da seleção.
As quantidades adicionadas acompanham os dispositivos. Editar a quantidade nos materiais adicionais desativa essa atualização para a linha. Remover uma sugestão permite adicioná-la novamente.
As referências GEN-* não afirmam compatibilidade com modelos concretos. Confirmar referência comercial, compatibilidade e preço. Não são inventados preços de catálogo.

PROPOSTA
Em Materiais e orçamento, carregar logo PNG/JPEG/WebP até 2 MB, preencher descrição, cliente, empresa, referência, validade e condições.
Proposta / PDF abre documento completo com capa, orçamento, plantas por piso com equipamentos numerados e legenda, imagens dos produtos, condições e notas.
O botão Imprimir / Guardar PDF fica disponível depois de concluir o carregamento das imagens. Imagens indisponíveis são identificadas.
As plantas mantêm as posições relativas do projeto; a impressão adapta-as à página e não deve ser usada para medir distâncias.
Não são incluídos custos internos nem margens.

GRAVAÇÃO
Logo, descrição e acessórios ficam no bloco comercial do projeto, com a gravação local/cloud existente.
Nenhuma alteração ao esquema Supabase ou aos planos/preços da licença.

TESTES
node tests/commercial-v8.test.cjs
node tests/proposal-v10.test.cjs
Testados cálculo, contagem, persistência, isolamento, acessórios sem duplicação, atualização de quantidades, edição manual, conteúdo e privacidade da proposta. Sintaxe dos módulos e do HTML autónomo verificada.
Validação visual e impressão real em navegador, bem como sessão e gravação real no Supabase, continuam pendentes. Não houve deploy.
