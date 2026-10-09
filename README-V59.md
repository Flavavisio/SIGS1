# SIGS v59 — lentes, zoom PTZ e ângulo morto

As speed domes apresentam zoom óptico em × na biblioteca, no painel, na planta e no relatório técnico. O limite vem de opticalZoom/optical_zoom/zoomOptical/optics.zoom, do nome PTZ com ×, ou da relação entre focais documentadas. Não se usa o número da referência para inventar zoom. Na ausência de focais documentadas, a conversão interna para o FOV é uma estimativa claramente identificada; na ausência também de zoom, o controlo fica bloqueado. Os projetos existentes mantêm a propriedade lens e não são reescritos.

A biblioteca inclui filtros combináveis de Ótica e Lente / Zoom, além de marca, tipo e pesquisa. Distingue fixa 4 mm, 2,8–12 mm, 2,8–13,5 mm e demais variantes documentadas. Dados em falta aparecem como «Por confirmar», sem serem classificados como uma focal real. O Ajax 4 mm mantém o ajuste bloqueado. Filtros reajustam as opções ao trocar marca/tipo/catálogo e desaparecem nos módulos de intrusão/incêndio.

O desenho da cobertura e das zonas DORI é recortado pela distância cega calculada para altura, inclinação e FOV. A área permanece transparente, sem preenchimento roxo, sem apagar a planta nem coberturas de outros equipamentos. Radar e térmica seguem a mesma regra. Propostas SVG passam a incluir a inclinação e a zona cega por sensor; versões públicas antigas sem inclinação usam 30°, como a aplicação.

Validação: optics-v59.test.cjs executa a instalação e os filtros reais em jsdom e os renderizadores de produção em Canvas, verificando píxeis transparentes, mapa de fundo, sobreposição, DORI e sensores especiais. As dependências de teste estão em tests/package.json. Foram também validados testes de ótica, lentes, Ajax, catálogo Visiotech, visibilidade, geometria, propostas e recuperação de projetos.
