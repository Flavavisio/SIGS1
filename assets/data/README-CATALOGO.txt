SIGS Design V2 — Catálogo Técnico Externo

Estrutura:
  assets/data/equipment-catalog.js
    Base de equipamentos CCTV, Ajax/Intrusão e Ajax EN54.

  assets/data/poe-network-catalog.js
    Consumos PoE por referência e switches usados nas recomendações.

  assets/data/product-images.js
    Associação entre referência/modelo e imagem no Supabase Storage.

  assets/data/catalog-summary.json
    Resumo automático do catálogo.

Estado atual:
  CCTV: 101
  Intrusão / Ajax: 61
  Incêndio EN54: 14
  Total de equipamentos: 176
  Modelos com consumo PoE específico: 26
  Switches PoE: 20
  Imagens mapeadas: 34

Fluxo para adicionar uma nova referência:
  1. Adicionar o equipamento em equipment-catalog.js.
  2. Se usar PoE, adicionar/confirmar o consumo em poe-network-catalog.js.
  3. Carregar a fotografia para o bucket Supabase product-images.
  4. Associar o modelo ao URL em product-images.js.
  5. Não alterar block-03.js nem block-05.js.

Os caminhos são relativos e compatíveis com GitHub Pages.


V6: O catálogo principal já está carregado no Supabase. O ficheiro local é apenas fallback/emergência; não existe sincronização automática no primeiro login.
