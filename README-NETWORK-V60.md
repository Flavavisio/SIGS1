# SIGS v60 — Engenharia de rede distribuída

Abrir **Rede** no cabeçalho ou **Sistema → Abrir engenharia de rede**. Projetos existentes mantêm o modo anterior. Para usar a topologia no dimensionamento e orçamento, ativar **Usar esta rede**. **Importar sugestão atual** cria, numa rede vazia, os equipamentos/associações da sugestão atual; não inventa comprimentos nem capacidades ausentes.

## Operação

- Equipamentos: adicionar switches e gravadores, escolher referência, piso e **Colocar na planta**. As capacidades conhecidas do catálogo são preenchidas; portas LAN/SFP, velocidade, comutação, normas PoE, FPS, analítica e descodificação em falta ficam pendentes. Introduzir capacidades documentadas e a fonte. Mudar de modelo limpa os valores específicos do modelo anterior.
- Câmaras: selecionar switch ou porta PoE do NVR e gravador de destino. É possível usar vários gravadores. Configurar porta, alimentação externa, norma/consumo máximo e tráfego de pico confirmados. A capacidade de PoE é validada por porta e por equipamento, com reserva.
- Ligações: criar switch–switch ou switch–gravador, cobre/fibra, grupos de portas, velocidades, comprimentos, patch cords, folgas e módulos ópticos. Cada uplink transporta apenas os streams cujo caminho até ao gravador o atravessa. Tráfego adicional pode ser introduzido por ligação.
- Agregação: switch central é um equipamento da topologia; LACP é uma ligação lógica com 2/4 membros. Exige confirmação em ambos os extremos, ocupa as portas físicas correspondentes, verifica capacidade agregada e maior fluxo por membro. O cálculo não garante distribuição uniforme real.
- Traçado: definir escala e colocar os extremos. Concluir liga ao destino no mesmo piso. Entre pisos, desenhar o segmento de cada piso até à passagem e indicar a vertical; medições incompletas ficam pendentes. Em alternativa, introduzir comprimento completo do percurso e vertical/folgas separadamente, sem duplicar medidas. Floor IDs preservam associações após alterações na lista de pisos; piso eliminado gera pendência.
- Recomendações: candidatos por switch consideram carga local, portas, potência, norma PoE e uplink. Campos desconhecidos são listados, não aprovados. Gravadores candidatos respeitam canais, banda, resolução, discos e marcas das câmaras atribuídas. Selecionar um candidato não confirma por si só a instalação.

## Documentos e gravação

Rede guardada em `commercial.network`, usando a gravação/histórico/autosave existentes, alternativas e exportação de projeto, sem migração de esquema ou alteração de autenticação. Alterações de topologia têm desfazer. Projetos arquivados bloqueiam edição. A rede substitui as quantidades automáticas anteriores de NVR/switch/discos/cabo: não duplica equipamentos. Cabos por medir são excluídos do total com indicação explícita. Fibra acrescenta os módulos declarados, ou referências «por confirmar». Preços são introduzidos no orçamento; nenhum preço de catálogo é inventado.

Relatório técnico inclui posição dos equipamentos e percursos na planta, inventário de rede, associações, comprimentos, tráfego/capacidade e verificações pendentes. Rede técnica permanece interna; propostas comerciais públicas mantêm a lista de materiais e preços autorizados, sem publicar configurações internas. UPS considera número de switches/NVRs/discos; consumos em vazio mantêm as hipóteses editáveis do painel e devem ser substituídos por carga medida, incluindo equipamentos alimentados localmente.

## Limites e referências

Topologia em árvore/floresta. Ciclos, ligações lógicas paralelas e caminhos em falta são sinalizados. STP, redundância, failover, multicast, tráfego de visualização não introduzido e distribuição real LACP não são simulados. Não aplica PoE através de fibra. Não certifica norma, analítica, compatibilidade ou autonomia.

Cobre: referência de canal de 100 m; modos de longo alcance exigem alcance, velocidade e compatibilidade explicitamente confirmados. Fibra: alcance/módulos/interfaces em falta permanecem desconhecidos.

- Cisco, cablagem Ethernet: https://www.cisco.com/c/en/us/support/docs/switches/catalyst-6500-series-switches/12027-53.html
- Cisco, IEEE 802.3ad / LACP: https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/application-services/m_ce-ieee-link-bndl-xe.html

Validação: network-v60.test.cjs testa distribuição de tráfego, agregação, múltiplos gravadores, PoE, conflitos de portas, caminhos/ciclos, cobre/fibra, traçados entre pisos, limites LACP, candidatos e materiais. network-ui-v60.test.cjs executa a interface real, posicionamento/traçado, guardar/retomar/desfazer, arquivo, escaping, orçamento e relatório. Passaram também 15 suites de regressão de engenharia, documentos, propostas, projetos, cablagem e ótica. Não se testou uma instalação física nem uma sessão autenticada de cliente em produção.
