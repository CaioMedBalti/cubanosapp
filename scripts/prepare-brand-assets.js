// Processa as 3 imagens de marca geradas pelo usuário (Downloads) em assets
// otimizados do app. Rodar uma vez: node scripts/prepare-brand-assets.js
//
// 1. marble-dark.jpg  — recorte do canto do key visual (sem o logo central)
// 2. emblema.png      — emblema do charuto com fundo quase-branco -> alpha
// 3. hero-cigar.jpg   — foto do charuto aceso comprimida
//
// Sem `palette: true` em nenhum png — quantização por paleta já derrubou o
// canal alpha silenciosamente numa leva anterior (ver resize-charutos.js).
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const DOWNLOADS = 'C:/Users/caiom/Downloads';
const ASSETS = path.join(__dirname, '..', 'assets');

const MARBLE_SRC = path.join(DOWNLOADS, 'Gemini_Generated_Image_qhyi1tqhyi1tqhyi.png');
const EMBLEM_SRC = path.join(DOWNLOADS, 'Gemini_Generated_Image_28tnai28tnai28tn.png');
const HERO_SRC = path.join(DOWNLOADS, 'Gemini_Generated_Image_af6cwaaf6cwaaf6c.png');

async function marble() {
  // Key visual 2816x1536 com logo+wordmark central — o recorte pega o canto
  // superior esquerdo, só textura de mármore (o "C" do wordmark começa por
  // volta de x~580/y~1000 nessa arte).
  const out = path.join(ASSETS, 'textures', 'marble-dark.jpg');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await sharp(MARBLE_SRC)
    .extract({ left: 0, top: 0, width: 560, height: 960 })
    .resize(700, null, { withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toFile(out);
  console.log('ok', out);
}

async function emblem() {
  const out = path.join(ASSETS, 'emblema.png');
  const { data, info } = await sharp(EMBLEM_SRC)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  // O fundo é um gradiente cinza-claro (não branco puro), com sombra suave sob
  // o emblema — limiar simples de luminância não separa. Flood-fill a partir
  // das bordas (mesma técnica do scripts/recover-alpha.js): só vira
  // transparente o que é claro E conectado à borda, preservando os brilhos
  // dourados internos do emblema.
  const isBackground = (i) => {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const lum = (r + g + b) / 3;
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    return lum > 170 && sat < 26; // cinza claro/neutro (fundo e sombra difusa)
  };

  const visited = new Uint8Array(width * height);
  const queue = [];
  for (let x = 0; x < width; x++) {
    queue.push(x, (height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    queue.push(y * width, y * width + width - 1);
  }
  while (queue.length) {
    const p = queue.pop();
    if (visited[p]) continue;
    visited[p] = 1;
    if (!isBackground(p * 4)) continue;
    data[p * 4 + 3] = 0;
    const x = p % width;
    const y = (p - x) / width;
    if (x > 0) queue.push(p - 1);
    if (x < width - 1) queue.push(p + 1);
    if (y > 0) queue.push(p - width);
    if (y < height - 1) queue.push(p + width);
  }

  await sharp(data, { raw: { width, height, channels: 4 } })
    .trim()
    .resize(600, null, { withoutEnlargement: true })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(out);
  console.log('ok', out);
}

async function hero() {
  const out = path.join(ASSETS, 'hero-cigar.jpg');
  await sharp(HERO_SRC)
    .resize(1200, null, { withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toFile(out);
  console.log('ok', out);
}

async function main() {
  await marble();
  await emblem();
  await hero();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
