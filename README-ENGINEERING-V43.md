# SIGS Studio — Engenharia avançada

A ferramenta Engenharia permite desenhar zonas com objetivos de detalhe e percursos de pessoas/carros, analisar a visibilidade e reproduzir o percurso na vista 3D da câmara. Os resultados acompanham o relatório técnico.

O perfil de imagem pode ser escolhido por projeto: DORI 2014 (4 níveis) ou IEC 62676-4:2025 (7 níveis). Referência: https://whitepapers.axis.com/en-us/pixel-density-based-on-iec-62676-4-2025 . Os níveis de densidade são referências geométricas para interpretação humana; não certificam a instalação nem substituem requisitos específicos do fabricante para analítica.

As zonas usam amostragem de pontos, a resolução horizontal e a geometria da câmara. Percursos usam velocidade constante e malhas de referência configuráveis; paredes são avaliadas à altura do alvo. Luz, exposição, compressão, desfocagem e movimento real não são simulados.

A validação de sistema compara as câmaras com o gravador/switch selecionados: canais, resolução, tráfego, margem, portas/potência PoE, ligação de rede, discos e extensão de cabos. Capacidades sem documentação são apresentadas como desconhecidas. A descodificação usa um modo documentado de canais/resolução/FPS, não soma capacidades incompatíveis.

Zonas e percursos ficam nos pisos do projeto; os parâmetros do sistema ficam no estado comercial/engenharia. Ambos acompanham gravações, restauro e revisões.

## Restauro da captura do mapa

Abrir um módulo não abre automaticamente o mapa interativo. Ao carregar um projeto, o mapa é fechado e a captura guardada é apresentada com a escala e bloqueio gravados. Os metadados do piso ativo têm prioridade. Respostas de imagens/Storage antigas são ignoradas depois de trocar de piso/projeto, e restaurar uma imagem do Storage não marca o projeto como alterado.

## Verificação

- `node tests/engineering-advanced-v43.test.cjs`
- `node tests/map-restore-v43.test.cjs`
- `node tests/restore-v26.test.cjs`
- `node tests/map-start-v14.test.cjs`
- `node tests/plant-lock-v22.test.cjs`
- `node tests/documents-v22.test.cjs`
- `node scripts/build-static.cjs`

Estes testes cobrem cálculos, eventos DOM, serialização, cancelamento, bloqueio de projetos arquivados e restauro assíncrono. A reprodução visual ainda deve ser validada em instalações reais, com dados de equipamento e dimensões verificados.
