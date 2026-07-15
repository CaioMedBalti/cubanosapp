# Scripts de catálogo (Firestore)

Scripts Node (CommonJS, sem build) que populam a coleção `cigars` do Firestore
do projeto `havana-app`. Todos são idempotentes: doc IDs determinísticos +
`set(..., { merge: true })` — rodar duas vezes não duplica nada.

## Pré-requisitos

- Node 18+.
- `firebase-admin` instalado. **Atenção:** este ambiente tem `NODE_ENV=production`
  global, o que faz o `npm install` pular devDependencies silenciosamente.
  Instale com:

  ```sh
  npm install --include=dev
  ```

- Credencial de service account do Firebase (`service-account.json`):
  Console Firebase → projeto `havana-app` → ⚙️ Configurações do projeto →
  Contas de serviço → "Gerar nova chave privada". Salve na raiz do repo
  (o `.gitignore` já ignora `service-account*.json` — **nunca commitar**).

## Ordem de execução

```sh
# 1. Catálogo base: 50 vitolas com imagem local + flavorNotes/rating curados
node scripts/seed-catalog.js --key=./service-account.json

# 2. Catálogo Habanos: 130 vitolas cubanas (enriquece as existentes e adiciona novas)
node scripts/seed-cuban-cigars.js --dry-run              # inspeção, não grava
node scripts/seed-cuban-cigars.js --key=./service-account.json
```

## `seed-cuban-cigars.js`

Fonte de dados: [`scripts/data/cuban-cigars.js`](data/cuban-cigars.js) — dataset
curado de 130 vitolas Habanos S.A. no formato
`[marca, linha, vitola, galera, mm, cepo, força, min_fumada]`, com força em
5 níveis (`suave | suave-médio | médio | médio-forte | forte`). O módulo também
exporta helpers (`CATALOG_TEXT`, `buscar`, `encontrar`, `FORCA_DOTS`...) para o
prompt da IA de identificação do app.

Comportamento:

- Cada vitola vira um doc na coleção `cigars` com `name` (vitola, sem marca),
  `brand`, `line`, `vitolaGalera` (nome de fábrica), `lengthMm`, `ringGauge`,
  `smokeTimeMin`, `strength` (rótulo de exibição — `constants/strength.ts`
  normaliza em runtime), `origin: 'Cuba'`, `isCuban: true`,
  `externalSource: 'manual_seed'` e `updatedAt`.
- Entradas com imagem local em `assets/charutos/cigar-mapping.json` reusam o
  doc ID do `seed-catalog.js` (ex.: `cohiba-behike-52`) — o merge enriquece o
  doc existente e preserva `flavorNotes`/`communityRating`, que este script
  **nunca escreve**. Matching normalizado com aliases (BHK ↔ Behike,
  singular/plural, San Cristóbal de La Habana ↔ San Cristóbal).
- Entradas sem imagem ganham ID slug determinístico (ex.:
  `montecristo-petit-edmundo`) e `imageKey: null`.
- Colisão de doc ID entre duas entradas do dataset aborta o script com erro.

Flags:

| Flag | Efeito |
| --- | --- |
| `--dry-run` | Processa e imprime o relatório (total, merges, novos, strengths) sem gravar; não exige credencial. |
| `--key=<path>` | Caminho do service account (alternativa: env `FIREBASE_SERVICE_ACCOUNT_KEY`). |

Estado atual do dry-run: 130 vitolas → 23 merges com docs existentes + 107 novas;
os docs existentes "Montecristo Especial" e "Quai d'Orsay Robusto" não estão no
dataset e permanecem intactos.

## `seed-catalog.js`

Seed original das 50 vitolas com imagem bundlada (`assets/charutos/cigs-final/`),
incluindo `flavorNotes` e `communityRating` curados. Flags: `--key=`, `--prune`
(remove docs fora do seed — **cuidado:** apaga também os docs criados pelo
`seed-cuban-cigars.js`; se usar, rode o seed cubano de novo em seguida).

## Por que não há ETL do CigarFinder aqui

A ideia original era popular o catálogo não-cubano via API do CigarFinder
(`mcp.cigarfinder.com`). Descartado em 2026-07: a API REST exige API key
(`Authorization: Bearer`) e a licença embutida em cada resposta proíbe
expressamente "populating internal product catalogs" sem acordo por escrito.
Se um acordo/key for obtido no futuro, os endpoints reais são `/api/v1/products`,
`/api/v1/categories` e `/api/v1/brands` (paginação `page`/`per_page`, máx. 50),
e o campo `brand` deles vem sujo (marca+linha coladas) — exigirá normalização
local de marcas.

## Demais scripts

`clean-logo.js`, `generate-icons.js`, `prepare-*.js`, `recover-alpha.js`,
`resize-charutos.js`: pipeline de assets de imagem/vídeo (sharp/ffmpeg) do app
e do site — sem relação com o catálogo. `reset-example-data.js`: reseta dados
de exemplo no Firestore.
