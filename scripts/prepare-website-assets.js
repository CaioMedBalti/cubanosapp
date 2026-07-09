// Prepara os assets do site marketing (website/assets/) a partir dos assets do
// app — one-off, roda da raiz do repo e nunca é deployado junto com o site.
// Uso: node scripts/prepare-website-assets.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'assets');
const OUT = path.join(ROOT, 'website', 'assets');

// Curadoria para a vitrine do catálogo (mistura cubanos icônicos + top new world).
const CATALOG_PICKS = [
  'Cohiba-Siglo-VI',
  'Montecristo-No2',
  'Partagas-Serie-D-No4',
  'Hoyo-de-Monterrey-Epicure-No2',
  'Romeo-y-Julieta-Wide-Churchill',
  'Trinidad-Vigia',
  'Arturo-Fuente-Opus-X',
  'Padron-1926-Serie-No9',
  'Davidoff-Winston-Churchill',
  'Liga-Privada-No9',
];

const BURN_CIGAR = 'Cohiba-Behike-52';

function ensureDirs() {
  for (const dir of ['fonts', 'img', 'cigars', path.join('cigars', 'catalog')]) {
    fs.mkdirSync(path.join(OUT, dir), { recursive: true });
  }
}

// Bounding box do alpha real — sharp.trim() decide "pixels chatos" por
// heurística; o scan manual garante corte exato na silhueta.
async function alphaTrim(inputPath, pad = 8) {
  const image = sharp(inputPath).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * channels + 3] > 16) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) throw new Error(`${inputPath}: nenhum pixel com alpha > 16`);
  return sharp(inputPath)
    .ensureAlpha()
    .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } });
}

// Sem `palette: true` — quantização por paleta já derrubou o canal alpha
// silenciosamente numa leva anterior (ver scripts/resize-charutos.js).
const PNG_OPTS = { compressionLevel: 9, adaptiveFiltering: true };

async function assertAlpha(filePath) {
  const meta = await sharp(filePath).metadata();
  if (!meta.hasAlpha) throw new Error(`ABORTADO: ${filePath} perdeu o canal alpha.`);
}

function report(filePath) {
  const kb = (fs.statSync(filePath).size / 1024).toFixed(0);
  console.log(`${path.relative(ROOT, filePath)}: ${kb} KB`);
}

async function main() {
  ensureDirs();

  // Emblema 400px webp (o site usa emblema + wordmark tipográfico; o logo
  // completo do app não entra)
  const emblemaOut = path.join(OUT, 'img', 'emblema-400.webp');
  await sharp(path.join(SRC, 'emblema.png'))
    .ensureAlpha()
    .resize(400, 400, { fit: 'inside' })
    .webp({ quality: 88 })
    .toFile(emblemaOut);
  await assertAlpha(emblemaOut);
  report(emblemaOut);

  // Cópias diretas: og:image e textura de mármore
  fs.copyFileSync(path.join(SRC, 'hero-cigar.jpg'), path.join(OUT, 'img', 'hero-cigar-og.jpg'));
  report(path.join(OUT, 'img', 'hero-cigar-og.jpg'));
  fs.copyFileSync(path.join(SRC, 'textures', 'marble-dark.jpg'), path.join(OUT, 'img', 'marble-dark.jpg'));
  report(path.join(OUT, 'img', 'marble-dark.jpg'));

  // Favicons a partir do favicon/icon do app
  const fav32 = path.join(OUT, 'img', 'favicon-32.png');
  await sharp(path.join(SRC, 'favicon.png')).resize(32, 32).png(PNG_OPTS).toFile(fav32);
  report(fav32);
  const touch180 = path.join(OUT, 'img', 'apple-touch-180.png');
  await sharp(path.join(SRC, 'icon.png')).resize(180, 180).png(PNG_OPTS).toFile(touch180);
  report(touch180);

  // Charuto herói da queima: alpha-trim + 1200px de largura, PNG (alpha obrigatório)
  const burnOut = path.join(OUT, 'cigars', 'burn-cigar@2x.png');
  const trimmed = await alphaTrim(path.join(SRC, 'charutos', 'cigs-final', `${BURN_CIGAR}.png`));
  await trimmed.resize(1200, null, { fit: 'inside', withoutEnlargement: false }).png(PNG_OPTS).toFile(burnOut);
  await assertAlpha(burnOut);
  report(burnOut);

  // Vitrine do catálogo: 480px webp com transparência
  for (const name of CATALOG_PICKS) {
    const out = path.join(OUT, 'cigars', 'catalog', `${name.toLowerCase()}.webp`);
    const t = await alphaTrim(path.join(SRC, 'charutos', 'cigs-final', `${name}.png`));
    await t.resize(480, null, { fit: 'inside' }).webp({ quality: 85 }).toFile(out);
    await assertAlpha(out);
    report(out);
  }

  console.log('---');
  console.log('Assets do site prontos em website/assets/.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
