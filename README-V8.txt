SIGS V8 — Materiais e orçamento unificados

Abrir app-Sigs.html com toda a pasta assets, ou usar app-Sigs-standalone-v8.html.

Implementado:
- Quantidades dos equipamentos de todos os pisos numa única lista comercial.
- NVR/switch sugeridos sem duplicar equipamentos já colocados desse tipo.
- Quantidade de discos calculada por capacidade; aviso quando excede as baias do NVR.
- Cabo por traçado e escala do respetivo piso quando disponível; estimativa identificada.
- Custos, venda manual ou calculada, margem sobre venda/acréscimo sobre custo.
- Desconto, IVA configurável, mão de obra e materiais adicionais.
- Cliente, empresa, referência, validade e condições comerciais por projeto.
- Proposta imprimível / Guardar PDF e CSV para cliente sem custos internos.
- Orçamento do relatório técnico PDF usa os mesmos preços e totais.
- Dados comerciais incluídos no projeto local, autosave cloud e histórico existente.
- Abertura de outro projeto limpa as condições do anterior.
- Projetos arquivados impedem edição comercial pela interface.

Utilização:
1. Desenhar a instalação.
2. Abrir Material ou Orçamento > Editar materiais e orçamento.
3. Definir custos/venda, mão de obra, condições e confirmar avisos.
4. Guardar o projeto.
5. Proposta / PDF > Imprimir / Guardar PDF, ou CSV para cliente.

Validação:
node tests/commercial-v8.test.cjs
Testados cálculos, contagens entre pisos, quantidade de discos, avisos, serialização, restauro e isolamento entre projetos. Sintaxe JavaScript verificada.
Interface visual e gravação real no Supabase ainda precisam de validação num navegador com sessão. Não foi efetuado deploy nem alteração de esquema da base de dados.

Limites desta fase:
- A proposta comercial separada não incorpora plantas ou logo; estes permanecem no relatório técnico existente.
- Referências HDD continuam genéricas.
- Cabo sem traçado validado permanece estimativa; não é medição de obra.
- Acessórios podem ser acrescentados manualmente; regras de compatibilidade automáticas ficam para a fase seguinte.
