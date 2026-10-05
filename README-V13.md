# SIGS Studio V13

- O controlo da distância focal recalcula imediatamente a zona cega no painel e no desenho lateral. A planta usa a mesma geometria vertical, incluindo inclinação de 0°.
- O campo vertical é uma estimativa para imagem 16:9: `2 atan(tan(HFOV/2) × 9/16)`. A zona cega ao nível do solo é `h / tan(tilt + VFOV/2)`, limitada a zero quando o campo inclui a vertical. O alcance geométrico pode atravessar o horizonte; a distância prática do catálogo permanece independente da lente.
- Menu e biblioteca partilham uma barra lateral recolhível, com preferência guardada neste navegador. A biblioteca permite pesquisar, filtrar por marca/tipo e carregar mais modelos. Mantém a seleção, colocação na planta, fotografias e menu de contexto dos equipamentos.
- Em ecrãs pequenos, os atalhos de navegação e biblioteca abrem a mesma barra lateral.

Validação: `node tests/optics-v13.test.cjs`, `node tests/workflow-v12.test.cjs`, `node tests/commercial-v8.test.cjs`, `node tests/proposal-v10.test.cjs`, `node tests/landing-v11.test.cjs`. A validação visual em navegador continua pendente.
