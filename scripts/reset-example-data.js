#!/usr/bin/env node
/**
 * Standalone cleanup for the Firestore "seed" data left over from the old
 * (removed) Seed button — wipes cigars/whiskies/posts/humidor and reseeds a
 * small, clearly-labeled example set for one real user.
 *
 * Not part of the Expo app bundle. Requires the `firebase-admin` package
 * (installed as a devDependency) and a Firebase service-account key JSON
 * file, which is NEVER committed to the repo.
 *
 * Usage:
 *   node scripts/reset-example-data.js --key=./service-account.json --email=you@example.com
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

async function clearCollection(collectionRef) {
  const snap = await collectionRef.get();
  await Promise.all(snap.docs.map((doc) => doc.ref.delete()));
}

async function main() {
  const args = parseArgs();
  const keyPath = args.key || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const email = args.email || process.env.RESET_USER_EMAIL;

  if (!keyPath || !email) {
    console.error('Usage: node scripts/reset-example-data.js --key=<path-to-service-account.json> --email=<login-email>');
    process.exit(1);
  }

  initializeApp({
    credential: cert(require(require('path').resolve(keyPath))),
  });

  const db = getFirestore();
  const user = await getAuth().getUserByEmail(email);
  const userId = user.uid;
  const authorName = user.displayName || email.split('@')[0];

  console.log(`Resolved UID ${userId} for ${email}. Wiping example data...`);

  await Promise.all([
    clearCollection(db.collection('cigars')),
    clearCollection(db.collection('whiskies')),
    clearCollection(db.collection('posts')),
    clearCollection(db.collection('users').doc(userId).collection('humidor')),
  ]);

  const cigars = [
    { name: 'Siglo VI', brand: 'Cohiba', origin: 'Cuba', strength: 'Médio-Forte', flavorNotes: ['Chocolate', 'Cedro', 'Terra'], communityRating: 5 },
    { name: 'Serie D No.4', brand: 'Partagás', origin: 'Cuba', strength: 'Forte', flavorNotes: ['Terra', 'Couro', 'Pimenta'], communityRating: 4 },
    { name: 'No.2', brand: 'Montecristo', origin: 'Cuba', strength: 'Médio', flavorNotes: ['Creme', 'Cedro', 'Nozes'], communityRating: 5 },
  ];

  const whiskies = [
    { name: 'Glenfiddich 18', brand: 'Glenfiddich', region: 'Speyside', age: 18, flavorNotes: ['Mel', 'Laranja', 'Especiarias'], communityRating: 4 },
    { name: 'Macallan 12', brand: 'Macallan', region: 'Speyside', age: 12, flavorNotes: ['Caramelo', 'Frutas Secas', 'Vanilla'], communityRating: 4 },
    { name: 'Laphroaig 10', brand: 'Laphroaig', region: 'Islay', age: 10, flavorNotes: ['Turfa', 'Defumado', 'Iodo'], communityRating: 4 },
  ];

  const humidorItems = [
    { cigarName: 'Siglo VI', brand: 'Cohiba', quantity: 3, status: 'intact', cigarId: 'Cohiba-Siglo-VI.png', unidentified: false, notes: 'Exemplo' },
    { cigarName: 'Serie D No.4', brand: 'Partagás', quantity: 5, status: 'intact', cigarId: 'Partagas-Serie-D-No4.png', unidentified: false, notes: 'Exemplo' },
    { cigarName: 'No.2', brand: 'Montecristo', quantity: 2, status: 'smoking', cigarId: 'Montecristo-No2.png', unidentified: false, notes: 'Exemplo' },
  ];

  const posts = [
    {
      userId,
      authorName,
      caption: 'Exemplo — experiência com um Cohiba Siglo VI, notas de chocolate amargo e cedro no final.',
      cigarName: 'Cohiba Siglo VI',
      whiskyName: 'Glenfiddich 18',
      rating: 5,
      likesCount: 12,
      commentsCount: 2,
      createdAt: FieldValue.serverTimestamp(),
    },
  ];

  await Promise.all([
    ...cigars.map((c) => db.collection('cigars').add(c)),
    ...whiskies.map((w) => db.collection('whiskies').add(w)),
    ...humidorItems.map((item) => db.collection('users').doc(userId).collection('humidor').add(item)),
    ...posts.map((p) => db.collection('posts').add(p)),
  ]);

  console.log('Done. Fake example data cleared and reseeded for', email);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
