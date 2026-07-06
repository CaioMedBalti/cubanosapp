#!/usr/bin/env node
/**
 * Popula o catálogo Firestore `cigars` com as 50 vitolas que têm imagem local
 * em assets/charutos (lib/cigarImages.ts), enriquecidas com dados públicos
 * (origem, força, notas). Idempotente: doc id determinístico derivado da
 * imageKey + set(merge) — rodar duas vezes não duplica nada.
 *
 * Uso:
 *   node scripts/seed-catalog.js --key=./service-account.json [--prune]
 *
 * --prune: remove docs de `cigars` cujo id não está no seed (limpa os
 *          exemplos antigos com id aleatório).
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--([^=]+)(?:=(.*))?$/);
    if (match) args[match[1]] = match[2] ?? true;
  }
  return args;
}

// strength usa exatamente os rótulos que constants/strength.ts normaliza:
// 'Suave' | 'Médio' | 'Médio-Forte' | 'Forte'
const CIGARS = [
  { imageKey: 'Cohiba-Behike-52.png', name: 'Behike 52', brand: 'Cohiba', origin: 'Cuba', strength: 'Forte', flavorNotes: ['Terra', 'Cedro', 'Café'], communityRating: 5 },
  { imageKey: 'Cohiba-Siglo-VI.png', name: 'Siglo VI', brand: 'Cohiba', origin: 'Cuba', strength: 'Médio-Forte', flavorNotes: ['Chocolate', 'Cedro', 'Mel'], communityRating: 5 },
  { imageKey: 'Cohiba-Robusto.png', name: 'Robusto', brand: 'Cohiba', origin: 'Cuba', strength: 'Médio-Forte', flavorNotes: ['Cedro', 'Café', 'Mel'], communityRating: 5 },
  { imageKey: 'Montecristo-No2.png', name: 'No. 2', brand: 'Montecristo', origin: 'Cuba', strength: 'Médio', flavorNotes: ['Creme', 'Cedro', 'Nozes'], communityRating: 5 },
  { imageKey: 'Montecristo-Especial.png', name: 'Especial', brand: 'Montecristo', origin: 'Cuba', strength: 'Médio', flavorNotes: ['Café', 'Creme', 'Madeira'], communityRating: 4 },
  { imageKey: 'Partagas-Serie-D-No4.png', name: 'Serie D No. 4', brand: 'Partagás', origin: 'Cuba', strength: 'Forte', flavorNotes: ['Terra', 'Couro', 'Pimenta'], communityRating: 5 },
  { imageKey: 'Partagas-Lusitania.png', name: 'Lusitania', brand: 'Partagás', origin: 'Cuba', strength: 'Forte', flavorNotes: ['Terra', 'Couro', 'Especiarias'], communityRating: 5 },
  { imageKey: 'Romeo-y-Julieta-Churchill.png', name: 'Churchill', brand: 'Romeo y Julieta', origin: 'Cuba', strength: 'Médio', flavorNotes: ['Cedro', 'Nozes', 'Baunilha'], communityRating: 4 },
  { imageKey: 'Romeo-y-Julieta-Wide-Churchill.png', name: 'Wide Churchill', brand: 'Romeo y Julieta', origin: 'Cuba', strength: 'Suave', flavorNotes: ['Creme', 'Cedro', 'Chocolate'], communityRating: 4 },
  { imageKey: 'Hoyo-de-Monterrey-Epicure-No2.png', name: 'Epicure No. 2', brand: 'Hoyo de Monterrey', origin: 'Cuba', strength: 'Suave', flavorNotes: ['Creme', 'Café', 'Cedro'], communityRating: 4 },
  { imageKey: 'H-Upmann-Magnum-46.png', name: 'Magnum 46', brand: 'H. Upmann', origin: 'Cuba', strength: 'Médio', flavorNotes: ['Creme', 'Baunilha', 'Madeira'], communityRating: 4 },
  { imageKey: 'Bolivar-Royal-Corona.png', name: 'Royal Corona', brand: 'Bolívar', origin: 'Cuba', strength: 'Forte', flavorNotes: ['Terra', 'Couro', 'Café'], communityRating: 4 },
  { imageKey: 'Trinidad-Reyes.png', name: 'Reyes', brand: 'Trinidad', origin: 'Cuba', strength: 'Médio', flavorNotes: ['Creme', 'Cedro', 'Baunilha'], communityRating: 4 },
  { imageKey: 'Trinidad-Vigia.png', name: 'Vigia', brand: 'Trinidad', origin: 'Cuba', strength: 'Médio', flavorNotes: ['Cedro', 'Café', 'Mel'], communityRating: 4 },
  { imageKey: 'Ramon-Allones-Specially-Selected.png', name: 'Specially Selected', brand: 'Ramón Allones', origin: 'Cuba', strength: 'Forte', flavorNotes: ['Frutas secas', 'Terra', 'Especiarias'], communityRating: 5 },
  { imageKey: 'Vegas-Robaina-Unicos.png', name: 'Unicos', brand: 'Vegas Robaina', origin: 'Cuba', strength: 'Médio', flavorNotes: ['Terra', 'Creme', 'Cedro'], communityRating: 4 },
  { imageKey: 'El-Rey-del-Mundo-Choix-Supreme.png', name: 'Choix Supreme', brand: 'El Rey del Mundo', origin: 'Cuba', strength: 'Suave', flavorNotes: ['Creme', 'Cedro', 'Amêndoa'], communityRating: 4 },
  { imageKey: 'Punch-Punch.png', name: 'Punch', brand: 'Punch', origin: 'Cuba', strength: 'Médio', flavorNotes: ['Madeira', 'Especiarias', 'Terra'], communityRating: 4 },
  { imageKey: 'La-Gloria-Cubana-Medaille-DOr.png', name: "Medaille D'Or", brand: 'La Gloria Cubana', origin: 'Cuba', strength: 'Médio', flavorNotes: ['Mel', 'Madeira', 'Especiarias'], communityRating: 4 },
  { imageKey: 'San-Cristobal-El-Principe.png', name: 'El Príncipe', brand: 'San Cristóbal', origin: 'Cuba', strength: 'Suave', flavorNotes: ['Mel', 'Creme', 'Terra'], communityRating: 4 },
  { imageKey: 'Sancho-Panza-Belicoso.png', name: 'Belicoso', brand: 'Sancho Panza', origin: 'Cuba', strength: 'Médio', flavorNotes: ['Madeira', 'Especiarias', 'Mel'], communityRating: 4 },
  { imageKey: 'Fonseca-Cosacos.png', name: 'Cosacos', brand: 'Fonseca', origin: 'Cuba', strength: 'Suave', flavorNotes: ['Amêndoa', 'Feno', 'Creme'], communityRating: 3 },
  { imageKey: 'Jose-L-Piedra-Petit-Cazadores.png', name: 'Petit Cazadores', brand: 'José L. Piedra', origin: 'Cuba', strength: 'Médio', flavorNotes: ['Terra', 'Madeira', 'Pimenta'], communityRating: 3 },
  { imageKey: 'Quai-dOrsay-Robusto.png', name: 'Robusto', brand: "Quai d'Orsay", origin: 'Cuba', strength: 'Suave', flavorNotes: ['Creme', 'Feno', 'Amêndoa'], communityRating: 4 },
  { imageKey: 'Diplomaticos-No2.png', name: 'No. 2', brand: 'Diplomáticos', origin: 'Cuba', strength: 'Médio', flavorNotes: ['Terra', 'Cedro', 'Cacau'], communityRating: 4 },
  { imageKey: 'Padron-1926-Serie-No9.png', name: '1926 Serie No. 9', brand: 'Padrón', origin: 'Nicarágua', strength: 'Forte', flavorNotes: ['Cacau', 'Café', 'Especiarias'], communityRating: 5 },
  { imageKey: 'Padron-Family-Reserve-45.png', name: 'Family Reserve 45', brand: 'Padrón', origin: 'Nicarágua', strength: 'Forte', flavorNotes: ['Cacau', 'Café', 'Caramelo'], communityRating: 5 },
  { imageKey: 'Oliva-Serie-V-Melanio.png', name: 'Serie V Melanio', brand: 'Oliva', origin: 'Nicarágua', strength: 'Médio-Forte', flavorNotes: ['Chocolate', 'Café', 'Caramelo'], communityRating: 5 },
  { imageKey: 'Oliva-Serie-G.png', name: 'Serie G', brand: 'Oliva', origin: 'Nicarágua', strength: 'Médio', flavorNotes: ['Nozes', 'Café', 'Cedro'], communityRating: 4 },
  { imageKey: 'My-Father-Le-Bijou-1922.png', name: 'Le Bijou 1922', brand: 'My Father', origin: 'Nicarágua', strength: 'Forte', flavorNotes: ['Chocolate', 'Pimenta', 'Terra'], communityRating: 5 },
  { imageKey: 'My-Father-Flor-de-las-Antillas.png', name: 'Flor de las Antillas', brand: 'My Father', origin: 'Nicarágua', strength: 'Médio', flavorNotes: ['Madeira', 'Especiarias', 'Mel'], communityRating: 4 },
  { imageKey: 'Plasencia-Alma-Fuerte.png', name: 'Alma Fuerte', brand: 'Plasencia', origin: 'Nicarágua', strength: 'Forte', flavorNotes: ['Cacau', 'Especiarias', 'Terra'], communityRating: 5 },
  { imageKey: 'Liga-Privada-No9.png', name: 'Liga Privada No. 9', brand: 'Drew Estate', origin: 'Nicarágua', strength: 'Forte', flavorNotes: ['Chocolate', 'Café', 'Terra'], communityRating: 5 },
  { imageKey: 'Drew-Estate-Undercrown-Maduro.png', name: 'Undercrown Maduro', brand: 'Drew Estate', origin: 'Nicarágua', strength: 'Médio-Forte', flavorNotes: ['Cacau', 'Café', 'Terra'], communityRating: 4 },
  { imageKey: 'Undercrown-Shade.png', name: 'Undercrown Shade', brand: 'Drew Estate', origin: 'Nicarágua', strength: 'Suave', flavorNotes: ['Creme', 'Amêndoa', 'Mel'], communityRating: 4 },
  { imageKey: 'Perdomo-20th-Anniversary.png', name: '20th Anniversary', brand: 'Perdomo', origin: 'Nicarágua', strength: 'Médio', flavorNotes: ['Caramelo', 'Café', 'Cedro'], communityRating: 4 },
  { imageKey: 'Illusione-Epernay.png', name: 'Epernay', brand: 'Illusione', origin: 'Nicarágua', strength: 'Médio', flavorNotes: ['Creme', 'Cedro', 'Frutas secas'], communityRating: 4 },
  { imageKey: 'Foundation-Charter-Oak.png', name: 'Charter Oak', brand: 'Foundation', origin: 'Nicarágua', strength: 'Suave', flavorNotes: ['Creme', 'Feno', 'Nozes'], communityRating: 4 },
  { imageKey: 'Davidoff-Nicaragua-Box-Pressed.png', name: 'Nicaragua Box-Pressed', brand: 'Davidoff', origin: 'Nicarágua', strength: 'Médio-Forte', flavorNotes: ['Pimenta', 'Chocolate', 'Café'], communityRating: 4 },
  { imageKey: 'Davidoff-Winston-Churchill.png', name: 'Winston Churchill', brand: 'Davidoff', origin: 'República Dominicana', strength: 'Médio', flavorNotes: ['Cedro', 'Nozes', 'Creme'], communityRating: 4 },
  { imageKey: 'Arturo-Fuente-Opus-X.png', name: 'Opus X', brand: 'Arturo Fuente', origin: 'República Dominicana', strength: 'Forte', flavorNotes: ['Especiarias', 'Cedro', 'Frutas secas'], communityRating: 5 },
  { imageKey: 'Arturo-Fuente-Hemingway-Signature.png', name: 'Hemingway Signature', brand: 'Arturo Fuente', origin: 'República Dominicana', strength: 'Médio', flavorNotes: ['Cedro', 'Creme', 'Especiarias'], communityRating: 4 },
  { imageKey: 'Ashton-VSG.png', name: 'VSG', brand: 'Ashton', origin: 'República Dominicana', strength: 'Forte', flavorNotes: ['Terra', 'Especiarias', 'Couro'], communityRating: 5 },
  { imageKey: 'Ashton-ESG.png', name: 'ESG', brand: 'Ashton', origin: 'República Dominicana', strength: 'Médio-Forte', flavorNotes: ['Cedro', 'Nozes', 'Mel'], communityRating: 4 },
  { imageKey: 'EP-Carrillo-Encore-Majestic.png', name: 'Encore Majestic', brand: 'E.P. Carrillo', origin: 'República Dominicana', strength: 'Médio', flavorNotes: ['Cedro', 'Nozes', 'Mel'], communityRating: 5 },
  { imageKey: 'La-Aurora-1495.png', name: '1495', brand: 'La Aurora', origin: 'República Dominicana', strength: 'Médio', flavorNotes: ['Madeira', 'Nozes', 'Mel'], communityRating: 4 },
  { imageKey: 'Rocky-Patel-Decade.png', name: 'Decade', brand: 'Rocky Patel', origin: 'Honduras', strength: 'Médio-Forte', flavorNotes: ['Chocolate', 'Terra', 'Especiarias'], communityRating: 4 },
  { imageKey: 'Camacho-Triple-Maduro.png', name: 'Triple Maduro', brand: 'Camacho', origin: 'Honduras', strength: 'Forte', flavorNotes: ['Chocolate amargo', 'Terra', 'Pimenta'], communityRating: 4 },
  { imageKey: 'Alec-Bradley-Prensado.png', name: 'Prensado', brand: 'Alec Bradley', origin: 'Honduras', strength: 'Médio-Forte', flavorNotes: ['Cacau', 'Café', 'Pimenta'], communityRating: 5 },
  { imageKey: 'Crowned-Heads-Four-Kicudos.png', name: 'Four Kicudos', brand: 'Crowned Heads', origin: 'Honduras/Nicarágua', strength: 'Médio', flavorNotes: ['Cacau', 'Pimenta', 'Madeira'], communityRating: 4 },
];

function docIdFor(imageKey) {
  return imageKey.replace(/\.png$/i, '').toLowerCase();
}

async function main() {
  const args = parseArgs();
  const keyPath = args.key || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!keyPath) {
    console.error('Usage: node scripts/seed-catalog.js --key=<path-to-service-account.json> [--prune]');
    process.exit(1);
  }

  initializeApp({
    credential: cert(require(require('path').resolve(keyPath))),
  });

  const db = getFirestore();
  const col = db.collection('cigars');
  const seedIds = new Set(CIGARS.map((c) => docIdFor(c.imageKey)));

  console.log(`Gravando ${CIGARS.length} charutos (merge, idempotente)...`);
  let batch = db.batch();
  let ops = 0;
  for (const cigar of CIGARS) {
    batch.set(col.doc(docIdFor(cigar.imageKey)), { ...cigar, imageUrl: null }, { merge: true });
    ops++;
    if (ops === 400) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }
  if (ops > 0) await batch.commit();

  if (args.prune) {
    const snap = await col.get();
    const strays = snap.docs.filter((d) => !seedIds.has(d.id));
    if (strays.length) {
      console.log(`--prune: removendo ${strays.length} docs fora do seed: ${strays.map((d) => d.id).join(', ')}`);
      await Promise.all(strays.map((d) => d.ref.delete()));
    } else {
      console.log('--prune: nada fora do seed.');
    }
  }

  const finalCount = (await col.count().get()).data().count;
  console.log(`Pronto. Coleção cigars agora tem ${finalCount} docs.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
