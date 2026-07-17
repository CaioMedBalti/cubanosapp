// Marca um usuário como admin (users/{uid}.isAdmin = true) — necessário para a
// tela de moderação (/admin/contributions). As Security Rules impedem
// auto-atribuição pelo client; este script usa o Admin SDK, que ignora rules.
//
// Uso:
//   node scripts/set-admin.js --key=./service-account.json --email=caio.med2003@gmail.com
//   node scripts/set-admin.js --key=./service-account.json --uid=<uid>
'use strict';

const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

function arg(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : null;
}

async function main() {
  const keyPath = arg('key') || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const email = arg('email');
  let uid = arg('uid');

  if (!keyPath) {
    console.error('Faltou --key=./service-account.json (ou env FIREBASE_SERVICE_ACCOUNT_KEY).');
    process.exit(1);
  }
  if (!email && !uid) {
    console.error('Informe --email=<email> ou --uid=<uid>.');
    process.exit(1);
  }

  const keyPath_ = path.resolve(keyPath);
  let serviceAccount;
  try {
    serviceAccount = require(keyPath_);
  } catch (e) {
    console.error(`Erro ao carregar ${keyPath_}:`, e.message);
    process.exit(1);
  }

  initializeApp({ credential: cert(serviceAccount) });
  const auth = getAuth();
  const db = getFirestore();

  if (!uid) {
    const user = await auth.getUserByEmail(email);
    uid = user.uid;
    console.log(`Auth: ${email} → uid ${uid}`);
  }

  const ref = db.collection('users').doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    console.error(`Doc users/${uid} não existe no Firestore — o usuário já abriu o app alguma vez?`);
    process.exit(1);
  }

  await ref.set({ isAdmin: true }, { merge: true });
  console.log(`✓ users/${uid} agora tem isAdmin: true (username: ${snap.data().username ?? '?'})`);
}

main().catch((e) => {
  console.error('ERRO:', e.message);
  process.exit(1);
});
