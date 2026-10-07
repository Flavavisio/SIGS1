# Engenharia: zonas, sistema, relatório e discos

A app inclui o botão **Engenharia**. Permite marcar vários pontos por câmara, atribuir nome, objetivo DORI e altura, editar gravação e definir os pressupostos de UPS. Os pontos e os parâmetros de gravação pertencem à câmara e são gravados no projeto; os pressupostos UPS pertencem às configurações comerciais/técnicas do projeto.

## Qualidade de imagem

A densidade utiliza a largura horizontal do stream (ou estimativa pela resolução escolhida), FOV e profundidade ótica do ponto. A verificação inclui enquadramento horizontal/vertical e interseção com paredes à altura do ponto. Verde significa que aquele ponto cumpre o limiar geométrico, não que toda a área tem qualidade garantida. Panorâmicas/fisheye exigem validação no equipamento. Iluminação, foco, movimento, compressão e aplicações analíticas requerem ensaio real.

Os limites DORI para avaliação humana são 25/62,5/125/250 px/m. Fonte: https://whitepapers.axis.com/download/wp_pixel_density_and_dori_t10176489_2501.pdf

## Armazenamento

O calculador separado da Uniview e o projeto usam o mesmo modelo. Baseline de planeamento H.264 = 2 Mbps por MP a 25 fps; H.265 = 50% desse baseline. São hipóteses editáveis pelo bitrate real, não especificações universais. Perfis Ultra 265: projeto 25%, cena calma 12,5%, cena muito calma 5% do baseline H.264. Os antigos IDs Basic/Adv/Max são preservados para ler projetos guardados, mas a interface identifica-os como cenários de cena, não modos oficiais. O perfil de 95% de redução exige confirmação por medição; não é o valor por defeito.

Uniview explica a dependência da cena e anuncia poupanças *até* 95%: https://www.uniview.com/News/News/201709/789820_169683_0.htm

A média medida tem prioridade e não recebe um segundo multiplicador de complexidade no calculador. FPS é uma aproximação linear apenas no modo automático. Horas/dia e percentagem de gravação reduzem armazenamento, nunca a reserva de banda da rede. O pico de rede pode ser indicado separadamente; sem medição usa-se uma estimativa H.265 conservadora relativamente ao Ultra 265, a confirmar incluindo substreams.

Fórmula: bytes = Mbps × 1 000 000 / 8 × segundos gravados. O cálculo interno permanece em GiB por compatibilidade; valores exibidos GB/TB e capacidades de discos são decimais. Exemplo: 1 Mbps contínuo × 24 h = 10,8 GB/dia; 30 dias = 324 GB antes de margens. A margem zero é respeitada. A reserva RAID no calculador é uma percentagem de planeamento, não uma topologia RAID validada.

## Dimensionamento

As recomendações mantêm preferência pela marca das câmaras e verificações de canais, resolução, banda, baias, discos, PoE por porta e uplink. Acrescentam 30% de reserva de banda no NVR, 5% de overhead e 20% de margem de armazenamento. Uma seleção anterior que deixe de cumprir é sinalizada pelo recomendador.

UPS: carga AC estimada = PoE/eficiência + switch sem PoE + NVR sem discos + discos + outras cargas. Uma carga AC medida substitui a soma inteira. Requer 25% de reserva em W e VA calculado pelo fator de potência introduzido. A autonomia pretendida e Wh de saída são requisitos; não se deduz autonomia real apenas de VA ou Wh. Não existe catálogo verificado de UPS nesta versão, pelo que são apresentados requisitos mínimos para selecionar um modelo pela curva do fabricante, e não uma referência inventada. Fonte: https://www.apc.com/us/en/support/product-support/ups-buying-guide-for-selecting-a-battery-backup-system.jsp

## Relatório e testes

O relatório técnico inclui zonas avaliadas, resultado, densidade, distância, recomendações justificadas, origem do bitrate, horário/atividade, pendências e pressupostos/fontes. Custos internos continuam excluídos. A cobertura técnica usa os mesmos cortes de paredes por altura da proposta.

Instalar dependências de teste com `npm ci --prefix tests`. Executar `node tests/engineering-v39.test.cjs` para modelo, calculador real e interação DOM (edição, pontos, guardar/restaurar, projeto arquivado e relatório). O site de produção continua estático, sem dependência de jsdom.
