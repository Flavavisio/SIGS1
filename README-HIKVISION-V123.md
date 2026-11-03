# Hikvision — panorâmicas, TandemVu e VPro (2026-11-03)

Inclui as 30 referências do filtro Visiotech «vista panorâmica: 180º» consultado nesta data, mais DS-2SF8C442MXG1-ELWY/26(F0) e DS-7616NXI-K2/Vpro. Variantes SL/SRB, cor e revisão mantêm a referência exata. Fichas e datas de consulta acompanham cada artigo; as imagens locais provêm das páginas do fornecedor ou do PDF Hikvision.

## Ótica e evidência

- FOV H/V e focais publicados, incluindo 180°, 182,2°, 182,6°, 185° e 190° ±5°. As lentes fixas não têm zoom. Não converter estes FOV para 179° para alimentar o modelo retangular.
- DORI publicado é uma referência à resolução nativa. Outra resolução exige nova validação; não é uma distância de analítica. O círculo de referência e o setor nominal não simulam fusão, dewarping ou a geometria exata das bordas panorâmicas. A vista 3D retangular fica indisponível para estas projeções.
- Nenhuma das fichas consultadas publica alcances padronizados de analítica separados por pessoa/veículo e dia/noite. Estes quatro campos ficam nulos e a interface/relatório mostra «não publicado». Não os substituir por IR, luz branca, DORI ou uma redução percentual inventada.
- DS-2CD23127G3P: FOV corrigido pela ficha Hikvision de 180°×77° (fornecedor) para 182,6°×74,6°. G3P PoE: máximo 24 W, distinto dos 20 W em DC. PanoVu IHSUY: 25 W em PoE; tamanho de sensor confirmado em Hikvision.

## TandemVu

PTZ 4 MP: 6–252 mm, 42×, FOV H 59°–2°, V 34,2°–1,1°, IR 300 m. Canal panorâmico 6 MP: 3680×1656, 2,8 mm, H 190°±5°, V 50°±5°, luz branca 30 m. Aplicada ficha PT de 20260309, com nota sobre divergências da ficha regional anterior. DORI PTZ de tele não é aplicado ao zoom atual.

A panorâmica tem orientação independente guardada por posição e inclinação limitada a 12–24°. O zoom/direção PTZ não altera essa panorâmica. Uma unidade física na proposta e uma porta de rede; reserva de dois canais de gravação e tráfego/armazenamento dos dois fluxos. Confirmar integração no protocolo/firmware do NVR. Para os PanoVu de quatro sensores está selecionado o modo panorâmico, não a gravação de quatro vistas originais.

A ficha atual publica a alimentação PoE 42,5–57 V / 1,76 A, sem consumo máximo explícito. Usa-se reserva conservadora SIGS de 100,32 W (57×1,76), marcada EST; não é uma medição nem consumo máximo declarado. Substituir pela potência confirmada no equipamento quando disponível; validar alimentação 802.3bt.

## NVR

DS-7616NXI-K2/Vpro sem PoE, 16 entradas, até 12 MP, 160 Mbps de entrada/saída, 2 SATA até 16 TB cada, LAN gigabit. Não recomendar para uma entrada panorâmica de 16/32 MP à resolução máxima. Descodificação guardada como modos alternativos: IA ativa 12×1080p/30, IA inativa 24×1080p/30. Perímetro por NVR: 2×até 4 MP ou 1×5–8 MP. AcuSearch/AcuSeek dependem da câmara e configuração; as condições são visíveis no sistema sugerido.

## Integração e verificação

O catálogo mantém os novos produtos após carregamento remoto e restauro; preserva IDs, custos e equipamentos personalizados. Factos técnicos e canal panorâmico acompanham o relatório local e a proposta gerada. As tabelas de factos apresentam DORI e iluminação separados da analítica.

Teste principal: `node tests/hikvision-panoramic-v123.test.cjs`. Cobre 30 SKUs por fixture, hashes das imagens, FOV nativo, bloqueio das lentes, DORI na resolução certa, ausência de alcances VCA inventados, seleção/propriedades reais, orientação da panorâmica, arquivo/undo/gravação, fluxos, consumo/armazenamento/rede, limites do NVR e reconstituição do catálogo remoto.

Verificação ampla: 80 de 86 suites passam; as seis falhas das suites históricas foram reproduzidas na revisão anterior 93d0f69 (cctv-expansion-v52, dori-labels-v40, intrusion-v87, project-entry-v19, thermal-cctv-v69 e wall-shadows-v38). Não são novas regressões. A execução integrada de todos os scripts é verificada separadamente. Testes locais não certificam alcances no terreno nem substituem validação com iluminação e alvos reais.
