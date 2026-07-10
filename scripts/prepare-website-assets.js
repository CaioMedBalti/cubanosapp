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

// Padronização da vitrine: todos os cards saem exatamente CAT_W×CAT_H com o
// charuto ocupando CAT_FRAC da largura, centrado — mesmo tamanho, mesmo lugar.
const CAT_W = 480;
const CAT_H = 160;
const CAT_FRAC = 0.88;

function ensureDirs() {
  for (const dir of ['fonts', 'img', 'cigars', path.join('cigars', 'catalog')]) {
    fs.mkdirSync(path.join(OUT, dir), { recursive: true });
  }
}

// Remove a franja branca de ~1px do recorte: erode o canal alpha (blur +
// remap linear — a borda de 50% fica no lugar, tudo abaixo colapsa a 0, recuo
// efetivo de ~1–1.5px). O RGB fica intocado; o anel branco contaminado
// simplesmente vira transparente. Retorna Buffer PNG RGBA.
async function defringe(inputPath) {
  const meta = await sharp(inputPath).metadata();
  const alphaBuf = await sharp(inputPath)
    .ensureAlpha()
    .extractChannel(3)
    .toColourspace('b-w')
    .blur(0.8)
    .linear(2.0, -128)
    .raw()
    .toBuffer();
  // Guarda anti-super-erosão: se o alpha zerou, algo está muito errado.
  let hasPixels = false;
  for (let i = 0; i < alphaBuf.length; i++) {
    if (alphaBuf[i] > 16) { hasPixels = true; break; }
  }
  if (!hasPixels) throw new Error(`ABORTADO: defringe zerou o alpha de ${inputPath}.`);
  // Intercalação manual RGB + alpha erodido — joinChannel não marca o canal
  // extra como alpha (a imagem sai opaca e o trim vira no-op).
  const rgb = await sharp(inputPath).removeAlpha().raw().toBuffer();
  const px = meta.width * meta.height;
  const rgba = Buffer.alloc(px * 4);
  for (let i = 0; i < px; i++) {
    rgba[i * 4] = rgb[i * 3];
    rgba[i * 4 + 1] = rgb[i * 3 + 1];
    rgba[i * 4 + 2] = rgb[i * 3 + 2];
    rgba[i * 4 + 3] = alphaBuf[i];
  }
  const out = await sharp(rgba, { raw: { width: meta.width, height: meta.height, channels: 4 } })
    .png()
    .toBuffer();
  const outMeta = await sharp(out).metadata();
  if (!outMeta.hasAlpha) throw new Error(`ABORTADO: defringe perdeu o alpha de ${inputPath}.`);
  return out;
}

// Bounding box do alpha real — sharp.trim() decide "pixels chatos" por
// heurística; o scan manual garante corte exato na silhueta.
// `input` aceita caminho ou Buffer (o construtor do sharp aceita ambos).
async function alphaTrim(input, pad = 8) {
  const image = sharp(input).ensureAlpha();
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
  if (maxX < 0) throw new Error(`alphaTrim: nenhum pixel com alpha > 16 (${typeof input === 'string' ? input : 'buffer'})`);
  return sharp(input)
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

  // Charuto herói da queima: defringe + alpha-trim + 1200px, PNG e webp irmão
  // (o webp era gerado à mão antes — agora sai do script e nunca mais desalinha)
  const burnSrc = await defringe(path.join(SRC, 'charutos', 'cigs-final', `${BURN_CIGAR}.png`));
  const trimmed = await alphaTrim(burnSrc);
  const burnResized = await trimmed
    .resize(1200, null, { fit: 'inside', withoutEnlargement: false })
    .png(PNG_OPTS)
    .toBuffer();
  const burnOut = path.join(OUT, 'cigars', 'burn-cigar@2x.png');
  fs.writeFileSync(burnOut, burnResized);
  await assertAlpha(burnOut);
  report(burnOut);
  const burnWebp = path.join(OUT, 'cigars', 'burn-cigar@2x.webp');
  await sharp(burnResized).webp({ quality: 90, alphaQuality: 90 }).toFile(burnWebp);
  await assertAlpha(burnWebp);
  report(burnWebp);

  // Vitrine do catálogo padronizada: defringe + trim justo + escala para
  // CAT_FRAC da largura + centragem num canvas fixo CAT_W×CAT_H.
  const targetW = Math.round(CAT_W * CAT_FRAC);
  const maxH = Math.round(CAT_H * CAT_FRAC);
  for (const name of CATALOG_PICKS) {
    const out = path.join(OUT, 'cigars', 'catalog', `${name.toLowerCase()}.webp`);
    const clean = await defringe(path.join(SRC, 'charutos', 'cigs-final', `${name}.png`));
    const t = await alphaTrim(clean, 0);
    const { data: scaled, info } = await t
      .resize(targetW, maxH, { fit: 'inside' })
      .png(PNG_OPTS)
      .toBuffer({ resolveWithObject: true });
    const left = Math.floor((CAT_W - info.width) / 2);
    const top = Math.floor((CAT_H - info.height) / 2);
    await sharp(scaled)
      .extend({
        left,
        right: CAT_W - info.width - left,
        top,
        bottom: CAT_H - info.height - top,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 85 })
      .toFile(out);
    await assertAlpha(out);
    report(out);
  }

  // Backgrounds de luxo (gerados por IA) — passo opcional: só roda se a pasta
  // assets/backgrounds/ existir com bg-*.png|jpg dentro.
  const BG_DIR = path.join(SRC, 'backgrounds');
  if (fs.existsSync(BG_DIR)) {
    const bgs = fs.readdirSync(BG_DIR).filter((f) => /^bg-.*\.(png|jpe?g)$/i.test(f));
    for (const f of bgs) {
      const base = f.replace(/\.(png|jpe?g)$/i, '');
      const src = path.join(BG_DIR, f);
      const jpgOut = path.join(OUT, 'img', `${base}.jpg`);
      await sharp(src).resize(1600, null, { fit: 'inside' }).jpeg({ quality: 70, mozjpeg: true }).toFile(jpgOut);
      report(jpgOut);
      const webpOut = path.join(OUT, 'img', `${base}.webp`);
      await sharp(src).resize(1600, null, { fit: 'inside' }).webp({ quality: 70 }).toFile(webpOut);
      report(webpOut);
    }
    if (bgs.length === 0) console.log('assets/backgrounds/ vazio — backgrounds pulados.');
  } else {
    console.log('assets/backgrounds/ não existe — backgrounds pulados.');
  }

  console.log('---');
  console.log('Assets do site prontos em website/assets/.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
