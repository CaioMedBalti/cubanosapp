#!/usr/bin/env node
/**
 * Popula o catálogo Firestore `cigars` com as 130 vitolas Habanos do dataset
 * curado em scripts/data/cuban-cigars.js. Idempotente: doc id determinístico +
 * set(merge) — rodar duas vezes não duplica nada.
 *
 * Entradas que correspondem a uma imagem local (assets/charutos/cigar-mapping.json)
 * reusam o doc id do seed-catalog.js (derivado da imageKey), então os docs
 * existentes são enriquecidos (line, vitolaGalera, dimensões...) sem perder
 * flavorNotes/communityRating — essas chaves nunca são escritas aqui.
 *
 * Uso:
 *   node scripts/seed-cuban-cigars.js --dry-run
 *   node scripts/seed-cuban-cigars.js --key=./service-account.json
 */

const path = require('path');
const { CATALOGO } = require('./data/cuban-cigars');
const mapping = require('../assets/charutos/cigar-mapping.json');

function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--([^=]+)(?:=(.*))?$/);
    if (match) args[match[1]] = match[2] ?? true;
  }
  return args;
}

// ─── Normalização / matching contra cigar-mapping.json ───────────────────────

// Aliases aplicados antes da normalização (dataset → vocabulário do mapping).
const TOKEN_ALIASES = [
  [/\bBHK\b/g, 'Behike'],
  [/\bSan Cristóbal de La Habana\b/g, 'San Cristóbal'],
  // Mapping antigo não tem o sufixo "No. 4" da Medaille d'Or.
  [/\bMedaille d'Or No\. 4\b/g, "Medaille d'Or"],
];

function normalize(s) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// Chave canônica: normaliza e remove um 's' final para casar singular/plural
// ("Lusitanias" ↔ "Lusitania", "Churchills" ↔ "Churchill").
function canonKey(s) {
  let out = s;
  for (const [re, repl] of TOKEN_ALIASES) out = out.replace(re, repl);
  out = normalize(out);
  return out.endsWith('s') ? out.slice(0, -1) : out;
}

// A vitola às vezes já embute a marca ("Punch Punch") — não duplicar.
function fullNameOf(marca, vitola) {
  return vitola.startsWith(marca) ? vitola : `${marca} ${vitola}`;
}

function docIdFor(imageKey) {
  return imageKey.replace(/\.png$/i, '').toLowerCase();
}

function slugify(s) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// 'suave-médio' → 'Suave-Médio' (rótulo de exibição, como o seed-catalog.js).
function capitalizeForca(forca) {
  return forca
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('-');
}

// canonKey(nome completo do mapping) → imageKey. Duplicatas ("...-2.png")
// ficam de fora: a primeira imageKey vista (a canônica, sem sufixo) vence.
function buildImageIndex() {
  const index = new Map();
  for (const [imageKey, entry] of Object.entries(mapping.mapping)) {
    if (entry.category !== 'cuban') continue;
    const key = canonKey(entry.name);
    if (!index.has(key)) index.set(key, imageKey);
  }
  return index;
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

function buildDocs() {
  const imageIndex = buildImageIndex();
  const docs = [];
  const byId = new Map();

  for (const [marca, linha, vitola, galera, mm, cepo, forca, minFumada] of CATALOGO) {
    const fullName = fullNameOf(marca, vitola);
    const imageKey = imageIndex.get(canonKey(fullName)) ?? null;
    const id = imageKey ? docIdFor(imageKey) : slugify(fullName);

    const doc = {
      id,
      data: {
        name: vitola,
        brand: marca,
        line: linha,
        vitolaGalera: galera,
        lengthMm: mm,
        ringGauge: cepo,
        smokeTimeMin: minFumada,
        strength: capitalizeForca(forca),
        origin: 'Cuba',
        isCuban: true,
        externalSource: 'manual_seed',
        imageKey,
      },
    };

    if (byId.has(id)) {
      const prev = byId.get(id);
      throw new Error(
        `Colisão de doc id "${id}": "${prev.data.brand} ${prev.data.name}" e "${marca} ${vitola}"`,
      );
    }
    byId.set(id, doc);
    docs.push(doc);
  }

  return docs;
}

async function main() {
  const args = parseArgs();
  const docs = buildDocs();

  const matched = docs.filter((d) => d.data.imageKey);
  const unmatched = docs.filter((d) => !d.data.imageKey);

  console.log(`Total de vitolas no dataset: ${docs.length}`);
  console.log(`Com imagem local (merge em doc existente): ${matched.length}`);
  for (const d of matched) console.log(`  ${d.id}  ←  ${d.data.brand} ${d.data.name}  [${d.data.imageKey}]`);
  console.log(`Novas sem imagem: ${unmatched.length}`);
  for (const d of unmatched) console.log(`  ${d.id}`);

  const forcas = [...new Set(docs.map((d) => d.data.strength))].sort();
  console.log(`Valores de strength gravados: ${forcas.join(', ')}`);

  if (args['dry-run']) {
    console.log('\n--dry-run: nada foi gravado.');
    return;
  }

  const keyPath = args.key || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!keyPath) {
    console.error('Usage: node scripts/seed-cuban-cigars.js --key=<path-to-service-account.json> [--dry-run]');
    process.exit(1);
  }

  const { initializeApp, cert } = require('firebase-admin/app');
  const { getFirestore, FieldValue } = require('firebase-admin/firestore');

  initializeApp({ credential: cert(require(path.resolve(keyPath))) });
  const db = getFirestore();
  const col = db.collection('cigars');

  console.log(`\nGravando ${docs.length} charutos (merge, idempotente)...`);
  let batch = db.batch();
  let ops = 0;
  for (const d of docs) {
    batch.set(col.doc(d.id), { ...d.data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    ops++;
    if (ops === 400) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }
  if (ops > 0) await batch.commit();

  const finalCount = (await col.count().get()).data().count;
  console.log(`Pronto. Coleção cigars agora tem ${finalCount} docs.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
